import ProtocolScheduleMessagesCommand from '../../common/protocol-schedule-messages-command.js';
import { OPERATION_ID_STATUS, ERROR_TYPE } from '../../../../constants/constants.js';

class GetScheduleMessagesCommand extends ProtocolScheduleMessagesCommand {
    constructor(ctx) {
        super(ctx);
        this.operationService = ctx.getService;

        this.errorType = ERROR_TYPE.GET.GET_START_ERROR;
        this.startEvent = OPERATION_ID_STATUS.GET.GET_FETCH_FROM_NODES_START;
    }

    getNextCommandData(command) {
        return {
            ...super.getNextCommandData(command),
            state: command.data.state,
            assetSync: command.data.assetSync,
            paranetSync: command.data.paranetSync,
            paranetId: command.data.paranetId,
            paranetRepoId: command.data.paranetRepoId,
            paranetLatestAsset: command.data.paranetLatestAsset,
            paranetDeleteFromEarlier: command.data.paranetDeleteFromEarlier,
        };
    }

    /**
     * Builds default getScheduleMessagesCommand
     * @param map
     * @returns {{add, data: *, delay: *, deadline: *}}
     */
    default(map) {
        const command = {
            name: 'getScheduleMessagesCommand',
            delay: 0,
            transactional: false,
        };
        Object.assign(command, map);
        return command;
    }
}

export default GetScheduleMessagesCommand;
