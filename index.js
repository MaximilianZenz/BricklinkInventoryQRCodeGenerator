const bricklinkPlus = require('bricklink-plus');
const prompt = require('prompt-sync')();
const qrcode = require('qrcode');
const fs = require("fs");
const cliProgress = require('cli-progress');
const cliSelect = require('cli-select');
const colors = require('ansi-colors')

const ConsumerKey = prompt('Enter your ConsumerKey:');
const ConsumerSecret = prompt('Enter your ConsumerSecret:');
const TokenValue = prompt('Enter your TokenValue:');
const TokenSecret = prompt('Enter your TokenSecret:');

bricklinkPlus.auth.setup({
    TOKEN_VALUE: TokenValue,
    TOKEN_SECRET: TokenSecret,
    CONSUMER_SECRET: ConsumerSecret,
    CONSUMER_KEY: ConsumerKey
});


console.log("Select which type of URL the QR codes should contain:")
cliSelect({
    values: ['public'],
    valueRenderer: (value, selected) => {
        return value;
    },
}).then(selection => {
    console.clear();
    if (!fs.existsSync('./out')) {
        fs.mkdirSync('./out');
    }


    bricklinkPlus.api.inventory.getInventories({item_type:'part'}).then(inventories=>{
        let inventoryCount = inventories.data.length;
        console.log(inventoryCount +" Inventories loaded.")

        const statusQRCodeGenerationStarted = new cliProgress.SingleBar({format: 'QR Codes generated: |' + colors.cyan('{bar}') + '| {percentage}% ({value}/{total})'}, cliProgress.Presets.shades_grey);
        const statusQRCodeGenerationFinished = new cliProgress.SingleBar({format: 'QR Codes saved: |' + colors.cyan('{bar}') + '| {percentage}% ({value}/{total})'}, cliProgress.Presets.shades_grey);
        statusQRCodeGenerationStarted.start(inventoryCount, 0);
        statusQRCodeGenerationFinished.start(inventoryCount, 0);
        for (let i = 0; i < inventoryCount; i++) {
            let inventory = inventories.data[i];
            let url ="";
            switch (selection.value) {
                case 'public':
                    url = "https://www.bricklink.com/v2/catalog/catalogitem.page?P="+encodeURIComponent(inventory.item.no)+"&C="+inventory.color_id;
                    break;
                default:
                    break;
            }
            let filename = "No Name";
            if(!inventory.color_name.includes("Not Applicable")){
                filename = i + encodeURIComponent(inventory.item.no)+"_"+encodeURIComponent(inventory.color_name);
            }else{
                filename = i + encodeURIComponent(inventory.item.no);
            }
            qrcode.toFile("./out/"+filename+".png", url, {
                errorCorrectionLevel: 'H'
            }, function(err) {
                if (err) throw err;
                if(i>= inventoryCount-1){
                    statusQRCodeGenerationFinished.stop();
                    console.clear();
                    console.log("All done!")
                }else{
                    statusQRCodeGenerationFinished.increment();
                }
            });

            statusQRCodeGenerationStarted.increment();
        }
        statusQRCodeGenerationStarted.stop();
    });
});




