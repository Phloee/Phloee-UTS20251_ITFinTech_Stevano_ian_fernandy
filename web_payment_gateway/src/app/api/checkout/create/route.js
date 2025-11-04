// Tambahkan di bagian setelah checkout berhasil dibuat (line ~150)

// 9. Send WhatsApp notification untuk checkout pending
if (customerInfo.phone) {
  const itemsList = enrichedItems
    .map((item, index) => 
      `${index + 1}. ${item.name}\n   ${item.quantity}x @ ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`
    )
    .join("\n");

  const pendingMessage = `✅ Payment PENDING
Thank you for your purchase! 🎉

💰 Amount: ${formatCurrency(total)}
🆔 Order ID: ${checkout._id}

*Detail Pesanan:*
${itemsList}

⏳ Your payment is pending.
Cepat selesaikan pembayaranmu!

— leleShop Team
> Sent via fonnte.com`;

  sendWhatsAppMessage(customerInfo.phone, pendingMessage).catch((err) => {
    console.error("⚠️ WhatsApp failed (non-critical):", err.message);
  });

  console.log("📱 WhatsApp notification queued");
}