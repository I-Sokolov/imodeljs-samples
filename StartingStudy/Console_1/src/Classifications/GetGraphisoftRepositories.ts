import * as rq from "request"
import * as fs from "fs"
import * as rqp from "request-promise-native"
import * as ch from "cheerio"
import * as path from "path"

export class Download {

  private urls : Array<string> = new Array<string> ();

  public async Run() {
    try {
      const url = "https://www.graphisoft.com/downloads/archicad/BIM_Data.html";
    
      console.log("Getting from " + url);

      await rqp.get(url, (error: any, response: rq.Response, body: any) => this.RequestCallback (error, response, body));

      for (const url of this.urls) {
        await this.GetFile (url);
      }

      console.log("Finish processing " + url);
    }
    catch (err) {
      console.error(err);
    }

  }

  private RequestCallback(error: any, response: rq.Response, body: any) {
    if (error) {
      console.error('error:', error); // Print the error if one occurred
    }
    else {
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      this.ParseGraphisoftResponese(body);
    }
  }

  private ParseGraphisoftResponese(response: string) {
    //console.log(response); 
    const $ = ch.load(response);
    const links = $("a");
    //console.log(links);
    links.each((i: number, link: CheerioElement) => {
      const url: string | undefined= $(link).attr("href");
      if (url && url.endsWith(".xml")) {
        console.log(`Found ${i}: ${url}`);
        this.urls.push(url);
      }
    });
  }

  private async GetFile(url: string) {
    console.log(`Requesting ${url}`);

    await rqp.get(url, (error: any, response: rq.Response, body: any) => {
      if (error) {
        console.error(error);
      }
      else {
        console.log(response); 

        const repoPath = "./src/Classifications/SavedRepositories";
        const basename = path.basename(url);
        
        const filePath = path.join(repoPath, basename);
        
        fs.writeFileSync(filePath, body);
        
        console.log(`Saved as ${filePath}`);
      }        
    }
    );

  }

}