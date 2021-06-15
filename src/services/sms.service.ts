import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'

const pinpoint = new AWS.Pinpoint()

const projectId = process.env.SMS_ID || '89c3aae913d046d98681b7d4cd80962a'

@Service()
export default class SmsService {
  // @Initializer()
  // async init(): Promise<void> {
  // }

  // [MOVE] to SMS Service
  async sendSms(phoneNumber: string, message: string): Promise<any> {
    var params = {
      ApplicationId: projectId,
      MessageRequest: {
        Addresses: {
          [phoneNumber]: {
            ChannelType: 'SMS'
          }
        },
        MessageConfiguration: {
          SMSMessage: {
            Body: message,
            // EntityId: 'STRING_VALUE',
            // Keyword: 'my_keyword_by_tum',
            // MediaUrl: 'STRING_VALUE',
            MessageType: 'TRANSACTIONAL',
            // OriginationNumber: '+66822451306',
            SenderId: 'CARGOLINK',
            // Substitutions: {
            //   '{####}': [
            //     otpCode,
            //   ],
            // },
            // TemplateId: 'STRING_VALUE'
          },
        },
      }
    };
    return await pinpoint.sendMessages(params).promise();
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
