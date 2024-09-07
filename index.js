const puppeteer = require('puppeteer-core')
const Chromium = require("@sparticuz/chromium")
const QRCode = require("qrcode")
const nodemailer = require('nodemailer')

const eventTitle = "KADAF 2.0";
const profilePicUrl = "https://i.seadn.io/gae/Ihufw_BbfNUhFBD-XF74FlY2JjpYeUkkTdhzJy_bjEdfz0qKlLMOkxlUKxyJR7ib5dgsji9XZAMuorSX20Fw12q5XZ2LJTj2efcS?auto=format&dpr=1&w=1000";


exports.handler = async (event, context, callback) => {
    try {
        const { to, subject, content, data } = event

        const nameTagHtml = await generateNameTagHtml(data);

        // Launch puppeteer and generate the PDF
        const browser = await puppeteer.launch({
            args: Chromium.args,
            defaultViewport: Chromium.defaultViewport,
            executablePath: await Chromium.executablePath(),
            headless: Chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();
        
        await page.setContent(nameTagHtml, { waitUntil: 'domcontentloaded' });
        //const pdfPath = path.resolve(__dirname, 'name_tag.pdf');
        
        const pdfBuffer = await page.pdf({ 
            width: '4.125in', 
            height: '6.45in',
            printBackground: true,
        });
        await browser.close();

        const emailContent = replacePlaceholders(content, data);

        return await sendEmailWithPdf(pdfBuffer, emailContent, to, subject);
    } catch (error) {
        console.error('Error sending email:', error);
        return JSON.stringify({ error: 'Error sending email' });
    }
}


function stringToBoolean(value) {
    return value.toLowerCase() === "true";
}


function replacePlaceholders(template, replacements) {
    return template.replace(/{{(\w+)}}/g, (placeholder, key) => {
        return replacements[key] || placeholder;
    });
}

async function generateQRCode(text) {
    return await QRCode.toDataURL(text, {
        width: 100,
    });
}


async function generateNameTagHtml(data) {

    const qrCodeDataUrl = await generateQRCode(data?.eventId);
    const logoImg = await imageToBase64("https://nia-kd-prod.s3.eu-north-1.amazonaws.com/logo.png")
    const avatarImg = await imageToBase64("https://nia-kd-prod.s3.eu-north-1.amazonaws.com/avatar.jpeg")
    const sponsorLogos = await convertLogosToBase64(data.sponsors)
    

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Name Tag</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 5.125in;
                    height: 6.45in;
                    margin: 0 auto;
                    border: 1px solid #000;
                }
                .header, .footer {
                    padding: 10px;
                }
                .header div {
                    font-size: 12px;
                    font-weight: 400;
                }
                .header img {
                    width: 28%;
                }
                .content {
                    padding: 20px 0;
                    margin-top: -15px;
                }
                .title {
                    font-size: 40px;
                    font-weight: bold;
                }
                .theme {
                    font-size: 18px;
                    margin: 10px 5px;
                    color: #fff;
                    font-weight: 200;
                    padding-left: 30px;
                    padding-right: 30px;
                }
                .theme-title {
                    font-size: 13px;
                    margin: 10px 5px;
                    color: #f3efef;
                    text-transform: uppercase;
                }
                .details {
                    font-size: 10px;
                    margin-bottom: 10px;
                    color: #f3efef;
                }
                .qr-code, .profile-pic {
                    display: inline-block;
                    vertical-align: top;
                    margin: 14px 5px;
                }
                .qr-code {
                    width: 100px;
                    height: 100px;
                }
                .profile-pic img {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                }
                .code-pic-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    
                }
                .speaker {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: -25px;
                }
                .sponsors img {
                    width: 50px;
                    margin: 5px;
                }
                .speaker-title {
                    color: #fff;
                    align-self: center;
                    margin-top: -10px !important;
                }
                .speaker-title span {
                    align-self: center;
                    background-color: #1d0b6d;
                    padding-left: 15px;
                    padding-right: 15px;
                    padding-top: 5px;
                    padding-bottom: 5px;
                    border-radius: 5px;
                }
                .theme-wrapper {
                    background: linear-gradient(180deg, #1d0b6d 0%, #3c0b6d 100%);
                    padding-top: 5px;
                    padding-bottom: 5px;
                }
                .divider {
                    border: #333;
                    border-style: dashed;
                    border-spacing: 6px;
                    border-width: 0.2px;
                }
                .sponsor-header {
                    margin-top: 10px;
                    padding-left: 20px;
                    padding-right: 20px;
                }
                .sponsor-title {
                    margin-top: 10px;
                    margin-bottom: 10px;
                    font-size: 12px !important; 
                    font-weight: normal !important;
                    color: #171616;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="${logoImg}" alt="NIA-Kd"/>
                    <div class="font-size:40px; !important">NIGERIAN INSTITUTE OF ARCHITECTS KADUNA STATE CHAPTER</div>
                </div>
                <div class="content">
                    <div class="title">${data.eventName}</div>
                    <div class="theme-wrapper">
                        <div class="theme-title">Theme</div>
                        <div class="theme">${data?.eventTheme}</div>
                        <div class="details">${data?.startDate} | ${data?.address}</div>
                    </div>
                    <div class="code-pic-section">
                        <div class="qr-code">
                            <img src="${qrCodeDataUrl}" alt="QR Code">
                        </div>
                        <div class="profile-pic">
                            <img src="${avatarImg}" alt="Profile Picture">
                        </div>
                    </div>
                    <div class="speaker">
                        <h4 class="">${data?.fullname}</h4>
                    </div>
                    <div class="speaker-title">
                        <span>Participant</span>
                    </div>
                </div>
                <div class="sponsor-header">
                    <div class="divider"></div>
                    <div class="sponsor-title">Sponsors</div>
                </div>
                <div class="sponsors">
                    ${sponsorLogos?.map((sponsor, index)=> `<img src="${sponsor.logo}" alt="Sponsor ${index+1}">`).join('')}
                </div>
            </div>
        </body>
        </html>
    `;
}

async function sendEmailWithPdf(pdfBuffer, emailContent, to, subject) {
    let transporter = nodemailer.createTransport({
        host: `${process.env.MAIL_HOST}`,
        port: parseInt(process.env.MAIL_PORT),
        secure: stringToBoolean(process.env.MAIL_SECURE),
        auth: {
            user: `${process.env.MAIL_USERNAME}`,
            pass: `${process.env.MAIL_PASSWORD}`,
        }
    });

    // Email options
    const mailOptions = {
        from: `NIA-Kd ${process.env.MAILER}`,
        to: to,
        subject: `Name Tag PDF - ${subject}`,
        html: emailContent,
        text: "Thank you for registering for the event. \nKindly print you name tag below.",
        attachments: [
            {
                filename: 'name_tag.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf',
            },
        ],
    };

    // Send the email
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info.response
    } catch (error) {
        console.error('Error sending email:', error);
        return JSON.stringify({ error: 'Error sending email' });
    }
}

async function imageToBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${response.headers.get('content-type')};base64,${base64}`;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
}

async function convertLogosToBase64(objectsArray) {
  const promises = objectsArray.map(async (obj) => {
    const base64Logo = await imageToBase64(obj.logo);
    return { logo: base64Logo };
  });

  return Promise.all(promises);
}