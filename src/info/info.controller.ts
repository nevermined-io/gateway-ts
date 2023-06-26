import { Get, Req, Controller, Logger } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { readFileSync } from 'fs'
import path from 'path'
import { Public } from '../common/decorators/auth.decorator'
import { Request } from '../common/helpers/request.interface'
import { GetInfoDto } from './dto/get-info.dto'
import { ContractHandler } from '@nevermined-io/sdk'
import { ethers } from 'ethers'
import NodeRSA from 'node-rsa'
import { NeverminedService } from '../shared/nevermined/nvm.service'
import { ConfigService } from '../shared/config/config.service'

@ApiTags('Info')
@Controller()
export class InfoController {
  constructor(private nvmService: NeverminedService, private config: ConfigService) {}
  @Get()
  @ApiOperation({
    description: 'Get API info',
    summary: 'Public',
  })
  @ApiResponse({
    status: 200,
    description: 'Return API Info',
    type: GetInfoDto,
  })
  @Public()
  async getInfo(@Req() req: Request<unknown>): Promise<GetInfoDto> {
    Logger.debug('Serving info')
    const nevermined = this.nvmService.getNevermined()
    const contractHandler = new ContractHandler(this.nvmService.instanceConfig())
    const pathEndpoint = `${req.protocol}://${req.hostname}${
      req.client.localPort ? `:${req.client.localPort}` : ''
    }${req.url}`
    const packageJsonPath = path.join(__dirname, '../..', 'package.json')
    const packageJsonString = readFileSync(packageJsonPath, 'utf8')
    const packageJson = JSON.parse(packageJsonString) as { version: string }

    const [provider] = await nevermined.accounts.list()

    const provider_key_file = readFileSync(this.config.get<string>('PROVIDER_KEYFILE')).toString()
    const provider_password = this.config.get<string>('PROVIDER_PASSWORD')
    const wallet = await ethers.Wallet.fromEncryptedJson(provider_key_file, provider_password)

    const rsa_key_file = readFileSync(this.config.get<string>('RSA_PUBKEY_FILE')).toString()
    const key = new NodeRSA(rsa_key_file)

    const baby = this.config.getProviderBabyjub()
    const provenanceEnabled = this.config.get<boolean>('ENABLE_PROVENANCE')
    const artifactDir = this.config.get<string>('ARTIFACTS_FOLDER')
    const circuitDir = this.config.get<string>('CIRCUITS_FOLDER')

    const providerURL = new URL(this.nvmService.web3ProviderUri())

    const contractInstances = nevermined.keeper.getAllInstances()
    const keys = Object.keys(contractInstances).filter(
      (key) => contractInstances[key]?.contract?.address !== undefined,
    )
    const contracts = keys.map((key) => ({ [key]: contractInstances[key].contract.address }))

    return {
      APIversion: packageJson.version,
      docs: `${pathEndpoint}api/v1/docs`,
      network: await nevermined.keeper.getNetworkName(),
      'keeper-url': `${providerURL.protocol}//${providerURL.host}`,
      'provenance-enabled': provenanceEnabled,
      'artifacts-folder': artifactDir,
      'circuits-folder': circuitDir,
      contracts: contracts,
      'external-contracts': [],
      'keeper-version': await contractHandler.getVersion('DIDRegistry', artifactDir),
      'provider-address': provider.getId(),
      'ecdsa-public-key': wallet.publicKey,
      'rsa-public-key': key.exportKey('public'),
      'babyjub-public-key': {
        x: baby.x,
        y: baby.y,
      },
    }
  }
}
