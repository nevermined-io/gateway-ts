import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { JWTPayload } from 'jose'
import { LoginDto } from './dto/login.dto'
import { CLIENT_ASSERTION_TYPE, jwtEthVerify } from '../common/guards/shared/jwt.utils'
import { BabyjubPublicKey } from '@nevermined-io/nevermined-sdk-js/dist/node/models/KeyTransfer'
import { Babysig } from '@nevermined-io/nevermined-sdk-dtp/dist/KeyTransfer'
import { ServiceType, ValidationParams } from '@nevermined-io/nevermined-sdk-js/dist/node/ddo/Service'
import { NeverminedService } from '../shared/nevermined/nvm.service'
import { didZeroX, zeroX } from '@nevermined-io/nevermined-sdk-js/dist/node/utils'
import { Logger } from '@nevermined-io/nevermined-sdk-js'

const BASE_URL = '/api/v1/gateway/services/'

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, private nvmService: NeverminedService) {}

  async validateOwner(did: string, consumer_address: string): Promise<void> {
    const nevermined = this.nvmService.getNevermined()
    const granted = await nevermined.keeper.conditions.accessCondition.checkPermissions(consumer_address, did)
    if (!granted) {
      throw new UnauthorizedException(`Address ${consumer_address} has no permission to access ${did}`)
    }
  }

  async validateAccess(params: ValidationParams, service: ServiceType): Promise<void> {
    const nevermined = this.nvmService.getNevermined()
    const plugin = nevermined.assets.servicePlugin[service]
    const granted = await plugin.accept(params)
    if (!granted) {
      const [from] = await nevermined.accounts.list()
      await plugin.process(params, from, undefined)
    }
  }

  async validateTransferProof(
    agreement_id: string,
    did: string,
    consumer_address: string,
    buyer: string,
    babysig: Babysig
  ): Promise<void> {
    const dtp = this.nvmService.getDtp()
    const buyerPub = new BabyjubPublicKey(zeroX(buyer.substring(0, 64)), zeroX(buyer.substring(64, 128)))
    if (!(await dtp.keytransfer.verifyBabyjub(buyerPub, BigInt(consumer_address), babysig))) {
      throw new UnauthorizedException(`Bad signature for address ${consumer_address}`)
    }
  }

  /**
   * RFC-7523 Client Authentication https://datatracker.ietf.org/doc/html/rfc7523#section-2.2
   * RFC-8812 ECDSA Signature with secp256k1 Curve (ES256K)
   * https://www.rfc-editor.org/rfc/rfc8812#name-ecdsa-signature-with-secp25
   * This implementation is different from the standard in:
   * - the size of the signature. ethereum adds an extra byte to the signature to help
   * with recovering the public key that create the signature
   * - the hash function used. ES256K uses sha-256 while ethereum uses keccak
   **/
  async validateClaim(clientAssertionType: string, clientAssertion: string): Promise<LoginDto> {
    if (clientAssertionType !== CLIENT_ASSERTION_TYPE) {
      throw new UnauthorizedException('Invalid "assertion_type"')
    }

    let payload: JWTPayload
    try {
      payload = jwtEthVerify(clientAssertion)

      const params: ValidationParams = {
        consumer_address: payload.iss,
        did: didZeroX(payload.did as string),
        agreement_id: payload.sub,
        buyer: payload.buyer as string,
        babysig: payload.babysig as Babysig,
      }

      if (payload.aud === BASE_URL + 'access') {
        await this.validateAccess(params, 'access')
      } else if (payload.aud === BASE_URL + 'download') {
        await this.validateOwner(payload.did as string, payload.iss)
      } else if (payload.aud === BASE_URL + 'nft-access') {
        await this.validateAccess(params, 'nft-access')
      }

      delete payload.exp
      return {
        access_token: this.jwtService.sign(payload),
      }
    } catch (error) {
      Logger.error(error)
      throw new UnauthorizedException(`The 'client_assertion' is invalid: ${(error as Error).message}`)
    }
  }
}
