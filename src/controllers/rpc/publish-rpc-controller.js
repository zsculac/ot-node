import BaseController from './base-rpc-controller.js';
import {
    NETWORK_MESSAGE_TYPES,
    CONTENT_ASSET_HASH_FUNCTION_ID,
} from '../../constants/constants.js';

class PublishController extends BaseController {
    constructor(ctx) {
        super(ctx);
        this.operationService = ctx.publishService;
        this.commandExecutor = ctx.commandExecutor;
        this.operationIdService = ctx.operationIdService;
    }

    async v1_0_0HandleRequest(message, remotePeerId, protocol) {
        const { operationId, keywordUuid, messageType } = message.header;

        const command = { sequence: [], delay: 0, transactional: false, data: {} };
        let dataSource;
        const [handleInitCommand, handleRequestCommand] = this.getCommandSequence(protocol);
        switch (messageType) {
            case NETWORK_MESSAGE_TYPES.REQUESTS.PROTOCOL_INIT:
                dataSource = message.data;
                command.name = handleInitCommand;
                command.period = 5000;
                command.retries = 3;

                break;
            case NETWORK_MESSAGE_TYPES.REQUESTS.PROTOCOL_REQUEST:
                try {
                    // eslint-disable-next-line no-case-declarations
                    dataSource = await this.operationIdService.getCachedOperationIdData(
                        operationId,
                    );
                    await this.operationIdService.cacheOperationIdData(operationId, {
                        assertionId: dataSource.assertionId,
                        assertion: message.data.assertion,
                    });
                    command.name = handleRequestCommand;
                    command.data.keyword = message.data.keyword;
                    command.data.agreementId = dataSource.agreementId;
                    command.data.agreementData = dataSource.agreementData;
                } catch (error) {
                    this.logger.error(
                        `Unable to handle publish request. Error message: ${error.message}`,
                    );
                }
                break;
            default:
                throw Error('unknown message type');
        }
        command.data = {
            ...command.data,
            remotePeerId,
            operationId,
            keywordUuid,
            protocol,
            assertionId: dataSource.assertionId,
            blockchain: dataSource.blockchain,
            contract: dataSource.contract,
            tokenId: dataSource.tokenId,
            keyword: dataSource.keyword,
            hashFunctionId: message.data.hashFunctionId ?? CONTENT_ASSET_HASH_FUNCTION_ID,
        };

        await this.commandExecutor.add(command);
    }
}

export default PublishController;
