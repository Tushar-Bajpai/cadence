import { z } from 'zod'

// ==========================================
// 1. Authentication Schemas
// ==========================================

export const passwordSchema = z
  .string()
  .min(9, 'Password must be at least 9 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: passwordSchema,
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
})

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'The code must be exactly 6 digits')

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: otpCodeSchema,
  password: passwordSchema,
})

export const staffCreateSchema = signupSchema.pick({
  name: true,
  email: true,
  password: true,
})

// ==========================================
// 2. Customer Schemas
// ==========================================

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  email: z.string().email('Invalid customer email address').trim().toLowerCase(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

// ==========================================
// 3. Product & Variant Schemas
// ==========================================

export const productVariantInputSchema = z.object({
  attribute: z.string().min(1).default('Addon'),
  value: z.string().min(1, 'Variant value is required'),
  extraPrice: z.coerce.number().min(0).default(0),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  type: z.string().default('service'),
  salesPrice: z.coerce.number().min(0, 'Sales price must be 0 or positive'),
  costPrice: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  variants: z.array(productVariantInputSchema).optional().default([]),
})

export const updateProductSchema = createProductSchema.partial()

// ==========================================
// 4. Billing Plan Schemas
// ==========================================

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').trim(),
  price: z.coerce.number().min(0, 'Price must be 0 or positive'),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  minQuantity: z.coerce.number().int().min(1).default(1),
  pausable: z.boolean().default(true),
  closable: z.boolean().default(true),
  renewable: z.boolean().default(true),
  autoCloseOnEnd: z.boolean().default(false),
})

export const updatePlanSchema = createPlanSchema.partial()

// ==========================================
// 5. Discount Schemas
// ==========================================

export const createDiscountSchema = z.object({
  name: z.string().min(1, 'Discount name/code is required').trim().toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  value: z.coerce.number().positive('Discount value must be greater than 0'),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']).default('SUBSCRIPTION'),
  usageLimit: z.coerce.number().int().min(1).default(100),
  days: z.coerce.number().int().min(1).default(30),
})

// ==========================================
// 6. Subscription Schemas
// ==========================================

export const subscriptionLineInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().nullable(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).default(0),
})

export const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  startDate: z.string().or(z.date()).optional(),
  expiryMonths: z.coerce.number().int().min(1).default(12),
  status: z.enum(['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED']).default('DRAFT'),
  lines: z.array(subscriptionLineInputSchema).optional().default([]),
})

export const subscriptionTransitionSchema = z.object({
  action: z.enum(['CONFIRM', 'ACTIVATE', 'CLOSE', 'REOPEN', 'PAUSE', 'RESUME']),
  reason: z.string().optional(),
})

// ==========================================
// 7. Billing Engine Schemas
// ==========================================

export const runBillingSchema = z.object({
  date: z.string().optional(),
  targetCustomerIds: z.array(z.string()).optional(),
})

// ==========================================
// 8. Invoices & Payments Schemas
// ==========================================

export const createPaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE']).default('CARD'),
  reference: z.string().optional(),
})

// ==========================================
// 9. Customer Portal Schemas
// ==========================================

export const portalSubscriptionActionSchema = z.object({
  action: z.enum(['PAUSE', 'RESUME', 'CLOSE']),
  reason: z.string().optional(),
})

export const portalAddLineSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
})

export const portalCreateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  notes: z.string().optional(),
})

export const portalPayInvoiceSchema = z.object({
  method: z.enum(['CARD', 'BANK_TRANSFER', 'UPI', 'CASH', 'CHEQUE']).default('CARD'),
  cardLast4: z.string().optional(),
  cardBrand: z.string().optional(),
  notes: z.string().optional(),
})

// ==========================================
// 10. Tax & Quotation Template Schemas
// ==========================================

export const createTaxSchema = z
  .object({
    name: z.string().min(1, 'Tax name is required').trim(),
    type: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
    value: z.coerce.number().min(0, 'A non-negative tax value is required'),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENTAGE' && data.value > 100) return false
      return true
    },
    {
      message: 'A percentage tax cannot exceed 100%',
      path: ['value'],
    }
  )

export const updateTaxSchema = z.object({
  name: z.string().min(1, 'Tax name cannot be empty').trim().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.coerce.number().min(0, 'A non-negative tax value is required').optional(),
  isActive: z.boolean().optional(),
})

export const templateLineInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').trim(),
  planId: z.string().min(1, 'A plan is required'),
  validityDays: z.coerce.number().int().min(1).default(30),
  lines: z.array(templateLineInputSchema).optional().default([]),
})

export const updateDiscountTargetedSchema = z.object({
  name: z.string().min(1, 'Discount name cannot be empty').trim().optional(),
  value: z.coerce.number().positive('A positive discount value is required').optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  minPurchase: z.coerce.number().min(0).optional().nullable(),
  minQuantity: z.coerce.number().int().min(1).optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  productIds: z.array(z.string()).optional(),
})

export const paymentCardInputSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{16}$/, 'Card number must be 16 digits')),
  cardholder: z.string().min(2, 'Cardholder name is required').trim(),
  validThru: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry must be in MM/YY format'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
})
