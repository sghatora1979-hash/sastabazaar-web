function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">{title}</h1>
      <div className="prose-sm text-gray-600 space-y-4 leading-relaxed">{children}</div>
    </div>
  );
}

export function ReturnPolicy() {
  return (
    <Policy title="Return Policy">
      <p>Changed your mind? You can return most items within <strong>7 days</strong> of delivery for a full refund to your original payment method.</p>
      <p>Items must be unused, in original packaging with all tags attached. For <strong>Purana Bazaar</strong> (second-hand) items, returns are accepted only if the item does not match its listed condition.</p>
      <p>To start a return, message us on WhatsApp at <strong>+91 90000 00000</strong> with your order ID.</p>
    </Policy>
  );
}

export function ShippingPolicy() {
  return (
    <Policy title="Shipping Policy">
      <p>Orders are dispatched <strong>same-day</strong> if placed before 4 PM IST, and delivered in 2–5 business days across India.</p>
      <p>Shipping is <strong>FREE</strong> on orders above ₹499, and a flat ₹49 below that. Cash on Delivery (COD) is available in most pincodes.</p>
      <p><strong>Local Bazaar</strong> purchases are pickup-only — meet the seller at a safe public location.</p>
    </Policy>
  );
}

export function TermsPage() {
  return (
    <Policy title="Terms of Service">
      <p>By using Sastabazaar you agree to shop fairly: accurate account details, no fraudulent payments, and no abuse of coupons or the Spin &amp; Win wheel.</p>
      <p>All payments on Naya, Purana and Clearance bazaars are held in <strong>escrow</strong> and released to the seller only after you confirm delivery (or after 7 days, whichever is earlier).</p>
      <p>Product images on this demo site are placeholders. Sellers are responsible for the accuracy of their listings.</p>
    </Policy>
  );
}

export function PrivacyPage() {
  return (
    <Policy title="Privacy Policy">
      <p>We collect only what we need to run your orders: name, contact details, delivery address and your likes/dislikes to personalize recommendations.</p>
      <p>Your data is never sold. Personalization currently runs on your own device (localStorage); server-side storage will be added with your explicit consent.</p>
      <p>Questions? Reach us on WhatsApp at <strong>+91 90000 00000</strong>.</p>
    </Policy>
  );
}
