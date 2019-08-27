let fs = require('fs');

var contents = {};

let fileNames = {
    'C': 'Cams-feed (1).dbf',
    'S': 'Sundaram_feed (1).dbf'
}
fs.readFile(fileNames.C, (err, buffer) => {
    if (err) throw err;

    // Headers
    contents.version = parseInt(buffer[0], 16);
    contents.modifiedDate = `${buffer.readUInt8(1) + 1900}/${buffer.readUInt8(2) + 1}/${buffer.readUInt8(3)}`;
    contents.itemCount = buffer.readUInt32LE(4);
    contents.headerBytes = buffer.readUInt16LE(8);
    contents.recordBytes = buffer.readUInt16LE(10);
    contents.reserveByte = buffer.readUInt16LE(12);
    contents.incompleteFlag = buffer.readUInt8(14);
    contents.encryptionFlag = buffer.readUInt8(15);
    contents.mdxFlag = buffer.readUInt8(28);
    contents.langDriverId = buffer.readInt8(29);
    contents.langDriverId = buffer.readInt16LE(30);
    contents.headerList = {};
    contents.itemList = [];

    let headerBytes = contents.headerBytes;
    let i = 0;

    buffer = buffer.slice(32);
    headerBytes -= 33;

    while (headerBytes) {
        let headerList = {
            fieldName: buffer.toString('utf-8', 0, 10).replace(/\0/g, ''),
            fieldType: buffer.toString('utf-8', 11, 12),
            fieldLength: buffer.readUInt8(16),
            fieldDecimalCount: buffer.readUInt8(17),
            workAreaId: buffer.readUInt16LE(18),
            example: buffer.readUInt8(19),
        }

        buffer = buffer.slice(32);
        contents.headerList[headerList.fieldName] = headerList;
        headerBytes -= 32;
    }
    buffer = buffer.slice(1);

    let headerKeys = Object.keys(contents.headerList);
    let itemCount = contents.itemCount;

    while (--itemCount) {
        let bufferIndex = 0;
        let recordStruct = {};
        for (let i = 0; i < headerKeys.length; i++) {
            let header = contents.headerList[headerKeys[i]];
            if (header.fieldType == 'C') {
                recordStruct[headerKeys[i]] = buffer.toString('utf-8', bufferIndex, bufferIndex + header.fieldLength).trim();
            } else if (header.fieldType == 'N') {
                recordStruct[headerKeys[i]] = buffer.toString('utf-8', bufferIndex, bufferIndex + header.fieldLength + header.fieldDecimalCount);
            }
            bufferIndex += header.fieldLength;
        }
        buffer = buffer.slice(contents.recordBytes);
        console.log(recordStruct);
        contents.itemList.push(recordStruct);
        break;
    }
    console.log(contents);
});