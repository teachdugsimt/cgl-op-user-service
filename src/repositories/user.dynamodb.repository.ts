import * as AWS from 'aws-sdk';

interface UserCreate {
  username: string
  password: string
  phoneNumber?: string
}

const documentClient = new AWS.DynamoDB.DocumentClient()

export default class UserDynamodbRepository {

  private tableName: string = process.env.USER_TABLE || ''

  async create(data: UserCreate): Promise<any> {
    const params = {
      TableName: this.tableName,
      Item: data
    };

    return documentClient.put(params).promise();
  }

  // async findAllByMobileNo(phoneNumber: string): Promise<any> {
  //   const params = {
  //     TableName: this.tableName,
  //     FilterExpression: "attribute_not_exists(phoneNumber) or phoneNumber = :null",
  //     ExpressionAttributeValues: {
  //         ':null': null
  //     }
  // }

  // dynamodb.scan(params, (err, data) => {
  //     if (err)
  //         console.log(JSON.stringify(err, null, 2));
  //     else
  //         console.log(JSON.stringify(data, null, 2));
  // })
  // }

  async findByUsername(username: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        username: username,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async findByMobeilNo(phoneNumber: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        phoneNumber: phoneNumber,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

  async update(data: UserCreate): Promise<any> {
    const { username, password } = data
    const params = {
      TableName: this.tableName,
      Key: { username: username },
      UpdateExpression: 'set password = :newPassword',
      ExpressionAttributeValues: {
        ':newPassword': password
      },
    };

    return await documentClient.update(params).promise();
  }

  async delete(username: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: {
        username: username,
      }
    };

    return documentClient.delete(params).promise();
  }
}
