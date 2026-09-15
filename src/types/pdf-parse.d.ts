declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFInfo {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
    text: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: unknown) => string | Promise<string>;
    max?: number;
    version?: string;
  }

  function pdf(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFInfo>;

  export default pdf;
}