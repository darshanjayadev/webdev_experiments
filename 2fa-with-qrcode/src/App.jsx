import { useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import * as OTPAuth from 'otpauth';
import CryptoJS from 'crypto-js'; // built in crypto node module can be used in backend
import { base32 } from '@scure/base';
import './App.css';
function App() {
  const [qrCodeText, setQrCodeText] = useState("Sekiro");
  const [secretSeed, setSecretSeed] = useState(null);
  const [inputCode, setInputCode] = useState("");
  const [isValidToken, setIsValidToken] = useState(undefined);

  const generateNew2faSeed = () => {
    // Generate secret seed
    // const secret = crypto.randomBytes(10).toString('base32');
    const wordArray = CryptoJS.lib.WordArray.random(5);
    const uint8Array = wordArray.toString().split('').map(char => char.charCodeAt(0));
    const secret = base32.encode(new Uint8Array(uint8Array));
    // Hash and store in DB - storing in client side for demonstration purposes
    setSecretSeed(secret);

    // Create a new TOTP object.
    let totp = new OTPAuth.TOTP({
      issuer: "Product Name",
      label: "Account identifier",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    setQrCodeText(OTPAuth.URI.stringify(totp));
  }

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    if(String(inputValue).length <= 6) {
      setInputCode(inputValue);
    }
  }

  const handle2faTest = (event) => {
    event.preventDefault();
    let totp = new OTPAuth.TOTP({
      issuer: "Product Name",
      label: "Account identifier",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretSeed)
    });
    let delta = totp.validate({ token: inputCode, window: 1 });
    setIsValidToken(delta);
    console.log(delta)
  }

  return (
    <>
      <h1>2FA with QR Code</h1>
      <main>
        <p>Scan the QR Code to add account to you 2FA application</p>
        <button onClick={generateNew2faSeed}>Generate new code</button>
        <QRCodeSVG className='qrcode' value={qrCodeText} />
        {
          secretSeed && (
            <div>
              <form onSubmit={handle2faTest}>
                <label>Code:</label>
                <input type="number" value={inputCode} onChange={handleInputChange} />
                <br />
                <button type="submit">Submit</button>
              </form>
              {renderValidity(isValidToken, inputCode)}
            </div>
          )
        }
      </main>
    </>
  )
}

/**
 * null -> invalid
 * 0 -> valid
 * -1 -> valid but outside validation windows i.e recently expired
 */
const renderValidity = (isValidToken, inputCode) => {
  if(inputCode) {
    if(isValidToken === null) {
      return <p>Invalid token!</p>
    } else {
      if (isValidToken === 0) {
        return <p>Valid token :)</p>
      } else if (isValidToken === -1) {
        return <p>Token just expired :(</p>
      } else return <p></p>
    }
  } else {
    return <p>Please submit your 6 digit 2FA Code</p>
  }
}

export default App
