const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY  

 const analyzeImage = async (imageUrl) => {
  const visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
  const features = [{ type: 'TEXT_DETECTION' }, { type: 'DOCUMENT_TEXT_DETECTION' }];
  
  const requestBody = {
    requests: [
      {
        image: { source: { imageUri: imageUrl } },
        features: features,
      },
    ],
  };

  try {
    const response = await fetch(`${visionApiUrl}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    
    const data = await response.json(); 

    if (!response.ok) {
      throw new Error(`Google Vision API Error: ${response.statusText}`);
    }

    const extractedData = data.responses[0];
    console.log(extractedData);
    if (!extractedData.fullTextAnnotation) {
      throw new Error('No document text found in the image.');
    }

    const text = extractedData.fullTextAnnotation.text;
    let validationError = null;
    let documentType = null;
    
    if (text.includes('invoice') && text.includes('Invoice No.') ) {
      documentType = 'commercial_invoice';
    } else if (text.includes('Bill of Lading')&& text.include("Carrier Name")) {
      documentType = 'bill_of_lading';
     
    } else if (text.includes('Shipper') ) {
      documentType = 'packing_list';
     
    } else if (text.includes('Exporter') ) {
      documentType = 'certificate_of_origin';
      
    }

    if (validationError) {
      throw new Error(validationError);
    }

    return { success: true, documentType };

  } catch (error) {
    console.error('Error during Google Vision API request:', error);
    return { success: false, error: error.message };
  }
};

const validateCommercialInvoice = (extractedData) => {
  const text = extractedData.fullTextAnnotation ? extractedData.fullTextAnnotation.text : '';
  return text.includes('Invoice') && text.includes('Total Amount');
};

const validateBillOfLading = (extractedData) => {
  const text = extractedData.fullTextAnnotation ? extractedData.fullTextAnnotation.text : '';
  return text.includes('Bill of Lading') && text.includes('Shipper');
};

const validatePackingList = (extractedData) => {
  const text = extractedData.fullTextAnnotation ? extractedData.fullTextAnnotation.text : '';
  return text.includes('Packing List') && text.includes('Item Description');
};

const validateCertificateOfOrigin = (extractedData) => {
  const text = extractedData.fullTextAnnotation ? extractedData.fullTextAnnotation.text : '';
  return text.includes('Certificate of Origin') && text.includes('Exporter');
};



module.exports=analyzeImage;
