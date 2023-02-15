import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Req,
  Response,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { Request } from '../common/helpers/request.interface'
import { Public } from '../common/decorators/auth.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import crypto from 'crypto'
import { AssetResult, NeverminedService } from '../shared/nevermined/nvm.service'
import { Logger } from '../shared/logger/logger.service'
import { TransferDto } from './dto/transfer'
import { UploadDto } from './dto/upload'
import { UploadResult } from './dto/upload-result'
import { generateId, ValidationParams, BigNumber, AgreementData } from '@nevermined-io/sdk'
import { aes_encryption_256 } from '@nevermined-io/sdk-dtp'

export enum UploadBackends {
  IPFS = 'ipfs',
  Filecoin = 'filecoin',
  AmazonS3 = 's3',
}

@ApiTags('Access')
@Controller()
export class AccessController {
  constructor(private nvmService: NeverminedService) {}

  @Get('access/:agreement_id/:index')
  @ApiOperation({
    description: 'Access asset',
    summary: 'Public',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the url of asset',
    type: StreamableFile,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request. DID missing',
    type: BadRequestException,
  })
  @ApiBearerAuth('Authorization')
  async doAccess(
    @Req() req: Request<unknown>,
    @Response({ passthrough: true }) res,
    @Param('index') index: number,
    @Query('result') result: AssetResult,
  ): Promise<StreamableFile | string> {
    if (!req.user.did) {
      throw new BadRequestException('DID not specified')
    }
    return await this.nvmService.downloadAsset(req.user.did, index, res, req.user.address, result)
  }

  @Get('nft-access/:agreement_id/:index')
  @ApiOperation({
    description: 'Access asset',
    summary: 'Public',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the url of asset',
    type: StreamableFile,
  })
  @ApiBearerAuth('Authorization')
  async doNftAccess(
    @Req() req: Request<unknown>,
    @Response({ passthrough: true }) res,
    @Param('index') index: number,
    @Query('result') result: AssetResult,
  ): Promise<StreamableFile | string> {
    return await this.nvmService.downloadAsset(req.user.did, index, res, req.user.address, result)
  }

  @Post('nft-transfer')
  @ApiOperation({
    description: 'Transfer an NFT',
    summary: 'Public',
  })
  @Public()
  @ApiResponse({
    status: 200,
    description: 'Return "success" if transfer worked',
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Agreeement not found',
    type: NotFoundException,
  })
  async doNftTransfer(
    @Body() transferData: TransferDto,
    @Req() req: Request<unknown>,
  ): Promise<string> {
    return this.internalTransfer(transferData, req, 'nft-sales')
  }

  private async internalTransfer(
    @Body() transferData: TransferDto,
    @Req() req: Request<unknown>,
    template: string,
  ): Promise<string> {
    Logger.debug(`Transferring NFT with agreement ${transferData.agreementId}`)
    const nevermined = this.nvmService.getNevermined()
    let agreement: AgreementData
    try {
      agreement = await nevermined.keeper.agreementStoreManager.getAgreement(
        transferData.agreementId,
      )
    } catch (e) {
      Logger.error(`Error resolving agreement ${transferData.agreementId}`)
      throw new NotFoundException(`Agreement ${transferData.agreementId} not found`)
    }
    if (!agreement) {
      Logger.error(`Agreement ${transferData.agreementId} not found`)
      throw new NotFoundException(`Agreement ${transferData.agreementId} not found`)
    }
    const params: ValidationParams = {
      consumer_address: transferData.nftReceiver,
      did: agreement.did,
      agreement_id: transferData.agreementId,
      nft_amount: BigNumber.from(transferData.nftAmount || '0'),
      buyer: (req.user || {}).buyer,
    }
    console.log(template, nevermined.assets.servicePlugin[template])
    const plugin = nevermined.assets.servicePlugin[template]
    const [from] = await nevermined.accounts.list()
    await plugin.process(params, from, undefined)
    return 'success'
  }

  @Post('nft-sales-proof')
  @ApiOperation({
    description: 'Transfer an NFT',
    summary: 'Public',
  })
  @ApiBearerAuth('Authorization')
  @ApiResponse({
    status: 200,
    description: 'Return "success" if transfer worked',
  })
  async doNftSales(
    @Body() transferData: TransferDto,
    @Req() req: Request<unknown>,
  ): Promise<string> {
    return this.internalTransfer(transferData, req, 'nft-sales-proof')
  }

  @Get('download/:index')
  @ApiOperation({
    description: 'Download asset',
    summary: 'Public',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the asset',
    type: StreamableFile,
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request. DID missing',
    type: BadRequestException,
  })
  @ApiBearerAuth('Authorization')
  async doDownload(
    @Req() req: Request<unknown>,
    @Response({ passthrough: true }) res,
    @Param('index') index: number,
    @Query('result') result: AssetResult,
  ): Promise<StreamableFile | string> {
    if (!req.user.did) {
      throw new BadRequestException('DID not specified')
    }
    return await this.nvmService.downloadAsset(req.user.did, index, res, req.user.address, result)
  }

  @Post('upload/:backend')
  @ApiOperation({
    description: 'Uploads a file or some content to a remote storage',
    summary: 'Public',
  })
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'Return the url of the file uploaded',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request. File missing or  Backend not supported',
    type: BadRequestException,
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Error uploading file to backend',
    type: InternalServerErrorException,
  })
  async doUpload(
    @Body() uploadData: UploadDto,
    @Param('backend') backend: UploadBackends,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResult> {
    let data: Buffer
    let fileName: string
    if (file) {
      data = file.buffer
      fileName = file.originalname
    } else if (uploadData.message) {
      data = Buffer.from(uploadData.message)
      fileName = `fileUpload_${generateId()}.data${uploadData.encrypt ? '.encrypted' : ''}`
    } else {
      throw new BadRequestException('No file or message in request')
    }
    if (!Object.values(UploadBackends).includes(backend))
      throw new BadRequestException(`Backend ${backend} not supported`)
    try {
      let url: string
      if (uploadData.encrypt) {
        // generate password
        Logger.debug(`Uploading with password, filename ${fileName}`)
        const password = crypto.randomBytes(32).toString('base64url')
        data = Buffer.from(aes_encryption_256(data, password), 'binary')
        url = await this.nvmService.uploadToBackend(backend, data, fileName)
        return { url, password }
      }

      url = await this.nvmService.uploadToBackend(backend, data, fileName)
      return { url }
    } catch (error) {
      Logger.error(`Error processing upload: ${error.message}`)
      throw new InternalServerErrorException(error.message)
    }
  }
}
