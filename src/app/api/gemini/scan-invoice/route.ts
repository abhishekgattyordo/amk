import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

let ai: GoogleGenAI | null = null;

function getGemini() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

export async function POST(req: NextRequest) {
  try {
    const gemini = getGemini();
    const body = await req.json();
    const base64Data = body.fileBase64 || body.pdfBase64;
    let mimeType = body.mimeType || "application/pdf";

    if (!base64Data) {
      return NextResponse.json({ error: "No invoice or quotation file data provided" }, { status: 400 });
    }

    // Normalize image/jpg to image/jpeg if needed
    if (mimeType === "image/jpg") {
      mimeType = "image/jpeg";
    }

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: `You are an expert OCR and data extraction system for ERPs. Extract all available data from this invoice, quotation, tax invoice, or delivery note.

STRICT INSTRUCTIONS:
1. Do NOT assume or invent fields that are not present. Return null or empty string if a field is not available.
2. Extract ALL line items separately (do NOT skip or consolidate items).
3. Extract supplier details, buyer details, document details, item details, tax details, totals, and additional notes/signatures.
4. Extract exact original values for names, GSTINs, invoice numbers, dates, HSN codes, vehicle numbers, quantities, rates, and amounts.
5. Return structured JSON matching the requested schema.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                gstin: { type: Type.STRING },
                state: { type: Type.STRING },
                stateCode: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
              }
            },
            buyer: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                gstin: { type: Type.STRING },
                state: { type: Type.STRING },
                stateCode: { type: Type.STRING },
                placeOfSupply: { type: Type.STRING },
              }
            },
            document: {
              type: Type.OBJECT,
              properties: {
                documentType: { type: Type.STRING },
                invoiceNumber: { type: Type.STRING },
                invoiceDate: { type: Type.STRING },
                referenceNumber: { type: Type.STRING },
                referenceDate: { type: Type.STRING },
                buyerOrderNumber: { type: Type.STRING },
                buyerOrderDate: { type: Type.STRING },
                deliveryNoteNumber: { type: Type.STRING },
                deliveryNoteDate: { type: Type.STRING },
                dispatchDocumentNumber: { type: Type.STRING },
                dispatchDate: { type: Type.STRING },
                paymentTerms: { type: Type.STRING },
                modeOfPayment: { type: Type.STRING },
                termsOfDelivery: { type: Type.STRING },
                destination: { type: Type.STRING },
                dispatchedThrough: { type: Type.STRING },
                billOfLadingLrRrNo: { type: Type.STRING },
                motorVehicleNumber: { type: Type.STRING },
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slNo: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  model: { type: Type.STRING },
                  size: { type: Type.STRING },
                  hsnSacCode: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  rate: { type: Type.NUMBER },
                  ratePerUnit: { type: Type.NUMBER },
                  discount: { type: Type.NUMBER },
                  taxableValue: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                }
              }
            },
            taxes: {
              type: Type.OBJECT,
              properties: {
                cgstRate: { type: Type.NUMBER },
                cgstAmount: { type: Type.NUMBER },
                sgstRate: { type: Type.NUMBER },
                sgstAmount: { type: Type.NUMBER },
                igstRate: { type: Type.NUMBER },
                igstAmount: { type: Type.NUMBER },
                otherTaxes: { type: Type.NUMBER },
                totalTaxAmount: { type: Type.NUMBER },
                taxableValue: { type: Type.NUMBER },
              }
            },
            totals: {
              type: Type.OBJECT,
              properties: {
                subtotal: { type: Type.NUMBER },
                totalQuantity: { type: Type.NUMBER },
                totalInvoiceValue: { type: Type.NUMBER },
                totalAmountBeforeTax: { type: Type.NUMBER },
                totalTax: { type: Type.NUMBER },
                totalAmountAfterTax: { type: Type.NUMBER },
                roundOff: { type: Type.NUMBER },
                amountInWords: { type: Type.STRING },
                taxAmountInWords: { type: Type.STRING },
              }
            },
            additional: {
              type: Type.OBJECT,
              properties: {
                declaration: { type: Type.STRING },
                notes: { type: Type.STRING },
                termsAndConditions: { type: Type.STRING },
                authorizedSignatory: { type: Type.STRING },
                preparedBy: { type: Type.STRING },
                verifiedBy: { type: Type.STRING },
                companyStamp: { type: Type.STRING },
                signature: { type: Type.STRING },
              }
            },
            // Top-level fallbacks for easy direct consumption
            supplierName: { type: Type.STRING },
            poNumber: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            invoiceDate: { type: Type.STRING },
            vehicleNumber: { type: Type.STRING },
            driverName: { type: Type.STRING },
            driverPhone: { type: Type.STRING },
            transporterName: { type: Type.STRING },
            modeOfTransport: { type: Type.STRING },
            materials: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  code: { type: Type.STRING },
                  hsnCode: { type: Type.STRING },
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  totalAmount: { type: Type.NUMBER },
                }
              }
            },
            totalAmount: { type: Type.NUMBER },
            gstDetails: { type: Type.STRING },
            warehouse: { type: Type.STRING },
          },
        },
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: "No response received from AI model" }, { status: 500 });
    }

    const parsed = JSON.parse(response.text);

    // Normalize backward-compatibility and convenient top-level mappings if missing
    if (!parsed.supplierName && parsed.supplier?.name) {
      parsed.supplierName = parsed.supplier.name;
    }
    if (!parsed.invoiceNumber && parsed.document?.invoiceNumber) {
      parsed.invoiceNumber = parsed.document.invoiceNumber;
    }
    if (!parsed.invoiceDate && parsed.document?.invoiceDate) {
      parsed.invoiceDate = parsed.document.invoiceDate;
    }
    if (!parsed.poNumber && parsed.document?.buyerOrderNumber) {
      parsed.poNumber = parsed.document.buyerOrderNumber;
    }
    if (!parsed.vehicleNumber && parsed.document?.motorVehicleNumber) {
      parsed.vehicleNumber = parsed.document.motorVehicleNumber;
    }
    if (!parsed.totalAmount && (parsed.totals?.totalInvoiceValue || parsed.totals?.totalAmountAfterTax)) {
      parsed.totalAmount = parsed.totals.totalInvoiceValue || parsed.totals.totalAmountAfterTax;
    }

    // Ensure items/materials array alignment
    if ((!parsed.materials || parsed.materials.length === 0) && parsed.items && parsed.items.length > 0) {
      parsed.materials = parsed.items.map((it: any) => ({
        name: it.name || it.description || "Material",
        code: it.hsnSacCode ? `HSN-${it.hsnSacCode}` : "RM-ITEM",
        hsnCode: it.hsnSacCode || "",
        description: [it.description, it.model, it.size].filter(Boolean).join(" | "),
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || "Nos",
        unitPrice: typeof it.rate === 'number' ? it.rate : (it.ratePerUnit || 0),
        totalAmount: typeof it.amount === 'number' ? it.amount : (it.taxableValue || 0),
      }));
    } else if ((!parsed.items || parsed.items.length === 0) && parsed.materials && parsed.materials.length > 0) {
      parsed.items = parsed.materials.map((m: any, idx: number) => ({
        slNo: String(idx + 1),
        name: m.name || "Material",
        description: m.description || "",
        hsnSacCode: m.hsnCode || "",
        quantity: typeof m.quantity === 'number' ? m.quantity : 1,
        unit: m.unit || "Nos",
        rate: typeof m.unitPrice === 'number' ? m.unitPrice : 0,
        amount: typeof m.totalAmount === 'number' ? m.totalAmount : 0,
      }));
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error scanning invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to scan invoice. Please ensure the document is clear and readable." }, { status: 500 });
  }
}

