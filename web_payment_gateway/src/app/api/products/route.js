import dbConnect from "../../libs/mongodb";
import Product from "../../models/Product";

export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let filter = { isActive: true };
    if (category && category !== "All") {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return Response.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
