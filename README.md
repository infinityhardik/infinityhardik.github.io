# Maintenance Readme

Needs NPM and Node

- npm install > Gets all Dependencies installed

Steps for Generating the Website :

- Update the Master Branch with New Changes and Test it thoroughly
- npm run build > Generates the Minified File in /dist
- Copy the minified JS file Code and Obfuscate it using <https://codebeautify.org/javascript-obfuscator#>
- Copy the Obfuscated JS Code into Branch which is deployed for Github Pages

Steps for Generating/Updating Products.json :

- Go To Alt RSP 3rd Format named Product Name Directory
- Update Filter named # JSON Continuous Updated List to currently available Products or as per need
- Excel Export the File and Clean the Data in Excel
- Rename the **Sheet1** to **productDirectory**
- Upload Excel File to convert it into JSON on <https://codebeautify.org/excel-to-json>
- Download JSON File
- Again Upload it to <https://codebeautify.org/jsonminifier> to Compress the JSON File
- Add it to the Master Branch and Github Pages deployed Branch
  