import * as AWS from 'aws-sdk';

interface UserResetPassEntity {
  id: number
  token: string
  expire: number
}

const documentClient = new AWS.DynamoDB.DocumentClient()

export default class UserResetPasswordDynamodbRepository {

  private tableName: string = process.env.USER_RESET_PASS_TABLE || ''

  async create(data: UserResetPassEntity): Promise<any> {
    const params = {
      TableName: this.tableName,
      Item: data
    };

    return documentClient.put(params).promise();
  }

  async findById(id: number): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        id: id,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByToken(token: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      FilterExpression: '#tk = :tk',
      ExpressionAttributeValues: {
        ':tk': token
      },
      ExpressionAttributeNames: {
        '#tk': "token"
      },
      // Limit: 1
    };

    const { Items } = await documentClient.scan(params).promise();
    return Items?.length ? Items[0] : null;
  }

  async update(data: UserResetPassEntity): Promise<any> {
    const { id, token, expire } = data
    const params = {
      TableName: this.tableName,
      Key: { id: id },
      UpdateExpression: 'set #tk = :newRefCode, #exp = :newExp',
      ExpressionAttributeValues: {
        ':newRefCode': token,
        ':newExp': expire
      },
      ExpressionAttributeNames: {
        "#tk": "token",
        "#exp": "expire"
      }
    };

    return await documentClient.update(params).promise();
  }

  async delete(id: Number): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        id: id,
      }
    };

    return documentClient.delete(params).promise();
  }
}
