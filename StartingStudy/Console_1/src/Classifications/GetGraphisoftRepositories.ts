import * as rq from "request"
import * as fs from "fs"
import * as rqp from "request-promise-native"

export class Download {

  private RequestCallback(error: any, response: rq.Response, body: any) {
    console.error('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.    
  }

  public async Run() {
    const request = await rqp.get("https://www.graphisoft.com/downloads/archicad/BIM_Data.html", this.RequestCallback);
    request.pipe(fs.createWriteStream('E:\\DevArea\\GitHub\\imodeljs-samples\\test.txt'));
  }

}