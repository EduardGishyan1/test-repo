import getCompanyInfo from "../../../../utils/getCompanyInfo.js";
import headers from "../../../../utils/constants/header.js";

export const handler = async (event) => {
  const companyInfo = await getCompanyInfo(process.env.COMPANY_INFO_TABLE_NAME);

  return {
    statusCode: 200,
    headers: headers,
    body: JSON.stringify({ info: companyInfo }),
  };
};
