import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import cryptoRandomString from 'crypto-random-string';
import * as crypto from 'crypto';
import Hashids from 'hashids';

const kms = new AWS.KMS()

const masterKeyId = process.env.MASTER_KEY_ID || 'arn:aws:kms:ap-southeast-1:911597493577:key/45154f8b-8eb2-4e8d-b569-53ab834ebba3'

@Service()
export default class UtillityService {
  // @Initializer()
  // async init(): Promise<void> {
  // }

  private salt: string = 'secretkeyforcargolinkproject'

  public characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  public alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

  // [MOVE] to utillity layer
  async encryptByKms(source: string): Promise<string | undefined> {
    const params = {
      KeyId: masterKeyId,
      Plaintext: source,
    };
    const { CiphertextBlob } = await kms.encrypt(params).promise();
    return CiphertextBlob?.toString('hex');
  }

  // [MOVE] to utillity layer
  async decryptByKms(source: string): Promise<string | undefined> {
    const params = {
      CiphertextBlob: Buffer.from(source, 'hex'),
    };
    const { Plaintext } = await kms.decrypt(params).promise();
    return Plaintext?.toString();
  }

  // [MOVE] to utillity layer
  generateUniqueId(length: number = 6): string {
    return cryptoRandomString({ length: length, characters: this.characters })
  }

  // [MOVE] to utillity layer
  generateRefCode(length: number = 6): string {
    return cryptoRandomString({ length: length, type: 'alphanumeric' })
  }

  // [MOVE] to utillity layer
  generateOtpCode(length: number = 4): string {
    return cryptoRandomString({ length: length, type: 'numeric' })
  }

  // [MOVE] to utillity layer
  generateOtpSecretCode(source: string): string {
    return crypto.createHmac('sha256', source).digest('hex');
  }

  // [MOVE] to utillity layer
  generateUserId(id: number): string {
    const hashids = new Hashids(this.salt, 8, this.alphabet);
    return hashids.encode(id);
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
