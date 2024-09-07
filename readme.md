## AWS Lambda Function: PDF Generation with Puppeteer and Email Delivery with Nodemailer

This guide explains how to create an AWS Lambda function that generates PDFs using Puppeteer and sends them via email using Nodemailer.

1. Setup AWS Lambda Environment

To use Puppeteer in AWS Lambda, you need a Lambda-compatible version of Chromium due to Lambda's size and runtime constraints. We'll use:

@sparticuz/chromium: A lightweight Chromium version for AWS Lambda.
puppeteer-core: A minimal Puppeteer version without Chromium.
nodemailer: For sending emails with the generated PDF attached.
Install Required Packages

```bash
npm install puppeteer-core @sparticuz/chromium nodemailer
```

* puppeteer-core: Excludes Chromium to keep the package size down.
* @sparticuz/chromium: Headless Chrome optimized for AWS Lambda.
* nodemailer: Sends emails with attachments like the PDF.

2. Lambda Handler (index.js)

```javascript
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    // Step 1: Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });
    
    const page = await browser.newPage();
    // set your html content as below
    //await page.setContent("<p>Hello world!</p>", {waitUntil: 'domcontentloaded' }})

    await page.goto('https://example.com', { waitUntil: 'networkidle2' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // Step 2: Send PDF via Email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use other email services if needed
      auth: {
        user: process.env.EMAIL_USER, // Set these as environment variables
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'recipient@example.com',
      subject: 'Generated PDF Document',
      text: 'Please find the attached PDF document.',
      attachments: [
        {
          filename: 'document.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully', info })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to generate PDF or send email', error })
    };
  }
};
```

### Key Components:
#### Puppeteer:
Uses puppeteer-core with @sparticuz/chromium to run headless Chrome on AWS Lambda.
Navigates to a URL (https://example.com) and generates a PDF.
#### Nodemailer:
Configured to use Gmail (you can change this to another email provider).
Sends an email with the generated PDF attached.

3. Environment Variables

For security reasons, sensitive information such as your email credentials should be stored as environment variables in AWS Lambda.

Set these environment variables:
```bash
EMAIL_USER: Your email address (e.g., Gmail).
EMAIL_PASS: Your email password (use an app password if using Gmail).
```

You can configure them in the AWS Lambda Console under the Environment Variables section.

4. Deploy to AWS Lambda

Zip the Project for Lambda
You’ll need to zip your project and include the node_modules folder along with index.js:

```bash
zip -r function.zip node_modules/ index.js
```

### Upload the Zip to Lambda
Go to AWS Lambda Console.
Create a new Lambda function.
Upload the function.zip file.
Configure the function's handler to point to index.handler.
### IAM Permissions
Make sure the Lambda function has the necessary permissions to use Nodemailer and send emails. If you are using AWS SES instead of a third-party service, configure appropriate IAM permissions.

5. Testing and Invocation

You can manually test your Lambda function using the Test option in the AWS Lambda Console or invoke it through API Gateway, SNS, or S3 events.

6. Error Handling

The Lambda function includes basic error handling. If any error occurs during PDF generation or email sending, the function logs the error and returns a 500 status code.

Adjust error handling based on your specific use case.

7. Conclusion

This setup demonstrates how to generate PDFs with Puppeteer on AWS Lambda and send them via email using Nodemailer. This is ideal for applications where you need to generate and send reports, invoices, or other dynamic content as PDFs.

### Available regions with custom aws lambda layer ARN that you can use

ap-northeast-1: arn:aws:lambda:ap-northeast-1:764866452798:layer:chrome-aws-lambda:47
ap-northeast-2: arn:aws:lambda:ap-northeast-2:764866452798:layer:chrome-aws-lambda:46
ap-south-1: arn:aws:lambda:ap-south-1:764866452798:layer:chrome-aws-lambda:47
ap-southeast-1: arn:aws:lambda:ap-southeast-1:764866452798:layer:chrome-aws-lambda:47
ap-southeast-2: arn:aws:lambda:ap-southeast-2:764866452798:layer:chrome-aws-lambda:47
ca-central-1: arn:aws:lambda:ca-central-1:764866452798:layer:chrome-aws-lambda:47
eu-north-1: arn:aws:lambda:eu-north-1:764866452798:layer:chrome-aws-lambda:47
eu-central-1: arn:aws:lambda:eu-central-1:764866452798:layer:chrome-aws-lambda:47
eu-west-1: arn:aws:lambda:eu-west-1:764866452798:layer:chrome-aws-lambda:47
eu-west-2: arn:aws:lambda:eu-west-2:764866452798:layer:chrome-aws-lambda:47
eu-west-3: arn:aws:lambda:eu-west-3:764866452798:layer:chrome-aws-lambda:47
sa-east-1: arn:aws:lambda:sa-east-1:764866452798:layer:chrome-aws-lambda:47
us-east-1: arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:47
us-east-2: arn:aws:lambda:us-east-2:764866452798:layer:chrome-aws-lambda:47
us-west-1: arn:aws:lambda:us-west-1:764866452798:layer:chrome-aws-lambda:47
us-west-2: arn:aws:lambda:us-west-2:764866452798:layer:chrome-aws-lambda:47