import dbConnect from "../../../lib/mongodb";
import Product from "../../models/Product";

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case "GET":
      try {
        const { category } = req.query;
        let filter = { isActive: true };

        if (category && category !== "All") {
          filter.category = category;
        }

        const products = await Product.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
          success: true,
          data: products,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      break;

    case "POST":
      try {
        const product = await Product.create(req.body);
        res.status(201).json({
          success: true,
          data: product,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
