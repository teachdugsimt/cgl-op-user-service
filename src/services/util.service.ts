import { Service, Initializer, Destructor } from 'fastify-decorators';
import * as AWS from 'aws-sdk'
import cryptoRandomString from 'crypto-random-string';
import * as crypto from 'crypto';
import Hashids from 'hashids';
import * as jwt from 'jsonwebtoken';

const kms = new AWS.KMS()

@Service()
export default class UtillityService {
  // @Initializer()
  // async init(): Promise<void> {
  // }

  private salt: string = 'secretkeyforcargolinkproject'
  private saltResetPass: string = 'secretkeyforcargolinkresetpassword'
  private masterKeyId = process.env.MASTER_KEY_ID || 'arn:aws:kms:ap-southeast-1:029707422715:key/f3f1a976-a2f4-4fb0-a4db-a7d0cbd59f4b'

  public characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  public alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

  // [MOVE] to utillity layer
  async encryptByKms(source: string): Promise<string | undefined> {
    const params = {
      KeyId: this.masterKeyId,
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
  generatePassword(length: number = 10): string {
    return cryptoRandomString({ length: length, type: 'base64' });
  }

  // [MOVE] to utillity layer
  encodeUserId(id: number): string {
    const hashids = new Hashids(this.salt, 8, this.alphabet);
    return hashids.encode(id);
  }

  // [MOVE] to utillity layer
  decodeUserId(cipherText: string): any {
    const hashids = new Hashids(this.salt, 8, this.alphabet);
    return hashids.decode(cipherText)[0]
  }

  // [MOVE] to utillity layer
  getUserIdByToken(token: string): any {
    const data: any = jwt.decode(token);
    return data['userId']
  }

  generateJwtToken(data: any): string {
    const dataSign: string = jwt.sign(data, this.salt)
    return dataSign
  }

  @Destructor()
  async destroy(): Promise<void> {
  }
}
