import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

interface UserCreate {
  username: string
  password: string
  phoneNumber?: string
}

const documentClient = new AWS.DynamoDB.DocumentClient()

export default class UserDynamodbRepository {

  private tableName: string = process.env.USER_TABLE || 'cgl_user'

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

  async findByUsernameWithPhoneNumber(username: string): Promise<any> {
    const params: DocumentClient.ScanInput = {
      TableName: this.tableName,
      FilterExpression: '#usr = :usr or #p = :p',
      ExpressionAttributeValues: {
        ':usr': username,
        ':p': username
      },
      ExpressionAttributeNames: {
        '#usr': "username",
        '#p': 'phoneNumber'
      },
    };

    const { Items } = await documentClient.scan(params).promise();
    return Items?.length ? Items[0] : null
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

  async updatePassword(username: string, password: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: { username: username },
      UpdateExpression: 'set password = :newPassword',
      ExpressionAttributeValues: {
        ':newPassword': password
      },
    };

    return documentClient.update(params).promise();
  }

  async updatePhoneNumber(username: string, phoneNumber: string): Promise<any> {
    const params = {
      TableName: this.tableName,
      Key: { username: username },
      UpdateExpression: 'set phoneNumber = :newPhoneNumber',
      ExpressionAttributeValues: {
        ':newPhoneNumber': phoneNumber
      },
    };

    return documentClient.update(params).promise();
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

  async updateUsername(oldUsername: string, newUsername: string): Promise<any> {
    const userDetailBackup = await this.findByUsername(oldUsername);
    await this.delete(oldUsername);
    await this.create({ ...userDetailBackup, username: newUsername });
    return true;
  }

  // async deleteAttachRow(): Promise<any> {
  //   let itemsArray: any = [{ DeleteRequest: { Key: { 'attach_code': '...1' } } },
  //   { DeleteRequest: { Key: { 'attach_code': '...2' } } }];

  //   var params = {
  //     RequestItems: {
  //       'cgl_attach_code': itemsArray
  //     }
  //   };
  //   documentClient.batchWrite(params, function (err, data) {
  //     if (err) {
  //       console.log('Batch delete unsuccessful ...');
  //       console.log(err, err.stack); // an error occurred
  //     } else {
  //       console.log('Batch delete successful ...');
  //       console.log(data); // successful response
  //     }

  //   })
  // }

  async createUploadLinkData(objectLink: UploadLink): Promise<any> {
    const params = {
      TableName: process.env.UPLOAD_LINK_DYNAMO || 'cgl_user_upload_link',
      Item: objectLink
    };

    return documentClient.put(params).promise();
  }

  async deleteUploadLink(user_id: string): Promise<any> {
    const params = {
      TableName: process.env.UPLOAD_LINK_DYNAMO || 'cgl_user_upload_link',
      Key: {
        user_id
      }
    };

    return documentClient.delete(params).promise();
  }

  async findAttachCodeWithUser(user_id: string): Promise<any> {
    const params = {
      TableName: process.env.UPLOAD_LINK_DYNAMO || 'cgl_user_upload_link',
      Key: {
        user_id,
      },
    };

    const { Item } = await documentClient.get(params).promise();
    return Item && Object.keys(Item)?.length ? Item : null
  }

}

export interface UploadLink {
  token: string
  user_id: string
}
