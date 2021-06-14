import * as AWS from 'aws-sdk';

interface UserResetPassEntity {
  id: number
  token: string
  expire: number
}

const documentClient = new AWS.DynamoDB.DocumentClient()

const tableName = process.env.USER_DYNAMO || 'cgl_user_reset_pass_test'

export default class UserResetPasswordDynamodbRepository {

  async create(data: UserResetPassEntity): Promise<any> {
    const params = {
      TableName: tableName,
      Item: data
    };

    return documentClient.put(params).promise();
  }

  async findById(id: string): Promise<any> {
    const params = {
      TableName: tableName,
      Key: {
        id: id,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByToken(token: string): Promise<any> {
    const params = {
      TableName: tableName,
      Key: {
        token: token,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async update(data: UserResetPassEntity): Promise<any> {
    const { id, token, expire } = data
    const params = {
      TableName: tableName,
      Key: { id: id },
      UpdateExpression: 'set token = :newRefCode, expire = :newExp',
      ExpressionAttributeValues: {
        ':newRefCode': token,
        ':newExp': expire
      },
    };

    return await documentClient.update(params).promise();
  }
}
