const puppeteer = require('puppeteer')
const fs = require('fs')

async function start(){
    const browser = await puppeteer.launch({headless:false})
    const page = await browser.newPage()
    await page.goto("https://www.switusa.com/product-page/bm-u275hdr",{waitUntil:'networkidle0'})

    const dropdown_selector = "//html//body//div[1]//div//div[3]//div//main//div//div//div//div[2]//div//div//div//div//div//div//article//div[1]//section[2]//div[6]//div[1]//div//div[1]//div//div[2]//div//div//div//div//button"
    await page.waitForXPath(dropdown_selector)
    var btn = await page.$x(dropdown_selector)
    await btn[0].click()
   
    const grabData = await page.evaluate(()=>{
        //Start of scraping elements
        const URL = window.location.href
        const OEM = document.querySelector("title").innerText.replace(/.*\| /,"")
        const image = document.querySelector(".slick-track > div:nth-of-type(1) > div > .main-media-image-wrapper-hook > div").getAttribute('href')
        const productName = document.querySelector("[data-hook='product-title']").innerText
        const sku = document.querySelector("[data-hook='sku']").innerText.replace("SKU: ","")
        const description = document.querySelector("[data-hook='description'] > p:nth-of-type(3)").innerText
        const price = document.querySelector("[data-hook='formatted-primary-price']").innerText
        const warranty = document.querySelectorAll("._1yvxJ.fggS-.cell")[2].innerText

        //Used trim to removed extra spaces and split to convert string to list
        var box = document.querySelectorAll("._1yvxJ.fggS-.cell")[1].innerText
        box = box.trim().split('\n')

        //Fetched download URL and download name and used the Product name, page URL whicj I have scraped earlier
        const downloadAnchor= document.querySelector("[data-hook='info-section-description'] > p >a")
        downloads =
        {
            "downloadName": downloadAnchor.innerText,
            "downloadUrl": downloadAnchor.getAttribute('href'),
            "productName": productName,
            "pageUrl": URL
        }

        //Getting Key Features, and replaced bullet header using regex
        const key_features = document.querySelectorAll("pre > p")
        const features = [
            key_features[5].innerText.replace(/◆ /,""),
            key_features[6].innerText.replace(/◆ /,"")
        ]
       
        //Specifications limited to 2, and can be varied/increased
        const specifications = []
        const specsList = document.querySelectorAll("[data-hook='info-section-description'] > table > tbody > tr")
        for (let k=0;k<2;k++){
            spec ={}
            spec['specName'] = specsList[k].firstElementChild.innerText
            spec['specDetails'] = specsList[k].lastElementChild.innerText 
            specifications.push(spec)
        }
        
        //fetching breadcrumbs
        const categories =[]
        const category_list = document.querySelectorAll("[data-hook='breadcrumbs'] > a")
        for (let j=0; j<category_list.length;j++){
            categories.push(category_list[j].innerText)
        }

        //final json preparation
        const json_data=[]
        const NodeList = document.querySelectorAll("#dropdown-options-container_1>div")
        for (let i=0;i<NodeList.length;i++){
           json_data.push(
            {
                "URL":URL,
                "OEM":OEM,
                "image":image,
                "productName":productName,
                "sku":sku,
                "description":description,
                "price":price,
                "mount": NodeList[i].title,
                "categories":categories,
                "specifications":specifications,
                "downloads":downloads,
                "box":box,
                "warranty":warranty.trim(),
                "features":features
            }
        )   
        }
        return json_data
        
    })
    
    //Used filesystem to write the json output
    fs.writeFile("dataNew.json", JSON.stringify(grabData,null,2), (err)=>{
        if (err) {
            console.error(err)
            return
        }
        console.log("Success")
    })
    await browser.close();
}

start()