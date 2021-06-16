import * as AWS from 'aws-sdk';

const documentClient = new AWS.DynamoDB.DocumentClient()

export default class OtpRepository {

  private tableName: string = process.env.OTP_TABLE || ''

  /**
   * 
   * @param variant value of hash
   * @param expire time to expire (value in milliseconds)
   * @returns object
   */
  async create(variant: string, expire: number = 90): Promise<any> {
    const timeToExpire = expire * 1000;
    const params = {
      TableName: this.tableName,
      Item: {
        variant: variant,
        expire: Math.floor((Date.now() + timeToExpire) / 1000)
      }
    };

    return await documentClient.put(params).promise();
  }

  async findByVariant(variant: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        variant: variant,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    const result = Item && Object.keys(Item)?.length ? Item : null
    return result
  }

}
