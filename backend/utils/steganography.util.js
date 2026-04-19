const CryptoJS = require('crypto-js');
const Jimp = require('jimp');

class Steganography {
  static async encodeImage(imagePath, secretMessage, fakeMessage, password) {
    const image = await Jimp.read(imagePath);
    const combinedData = JSON.stringify({
      real: secretMessage,
      fake: fakeMessage || 'No secret message here'
    });
    const encrypted = CryptoJS.AES.encrypt(combinedData, password).toString();
    
    let binary = '';
    for (let i = 0; i < encrypted.length; i++) {
      binary += encrypted.charCodeAt(i).toString(2).padStart(8, '0');
    }
    binary += '00000000';
    
    let idx = 0;
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, offset) => {
      if (idx < binary.length) {
        const bit = parseInt(binary[idx]);
        image.bitmap.data[offset] = (image.bitmap.data[offset] & 0xFE) | bit;
        idx++;
      }
    });
    
    const outputPath = `uploads/encoded_${Date.now()}.png`;
    await image.writeAsync(outputPath);
    return outputPath;
  }
  
  static async decodeImage(imagePath, password, userLocation = null, allowedLocations = []) {
    const image = await Jimp.read(imagePath);
    let binary = '';
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, offset) => {
      if (binary.slice(-8) !== '00000000') {
        binary += image.bitmap.data[offset] & 1;
      }
    });
    
    let encrypted = '';
    for (let i = 0; i < binary.length - 8; i += 8) {
      const byte = binary.substr(i, 8);
      if (byte !== '00000000') {
        encrypted += String.fromCharCode(parseInt(byte, 2));
      }
    }
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Wrong password');
    
    let data;
    try {
      data = JSON.parse(decrypted);
    } catch {
      data = { real: decrypted, fake: 'No secret message here' };
    }
    
    if (allowedLocations && allowedLocations.length > 0 && userLocation) {
      let isInAllowedLocation = false;
      for (const loc of allowedLocations) {
        const distance = this.calculateDistance(
          userLocation.lat, userLocation.lng, loc.lat, loc.lng
        );
        if (distance <= (loc.radius || 100)) {
          isInAllowedLocation = true;
          break;
        }
      }
      if (!isInAllowedLocation) {
        throw new Error('Location not authorized');
      }
    }
    
    return data;
  }
  
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = Steganography;