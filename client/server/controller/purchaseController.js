const Product = require('../models/productModels');
const User = require('../models/userModel');

// Function to get a product by ID from the database
async function getProductById(productId) {
  try {
    // Find the product with the given ID
    const product = await Product.findOne({ id: productId });

    if (product) {
      return product; // Return the product if found
    } else {
      return null; // Return null if product not found
    }
  } catch (error) {
    console.error('Error occurred while getting product by ID:', error);
    throw error; // Throw error for better error handling in getProduct function
  }
}

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).select('id name description price -_id');
    return res.status(200).json(products); // Send the products as JSON response
  } catch (error) {
    console.error('Error occurred while fetching products:', error);
    return res.status(500).send('Error occurred while fetching products.'); // Send 500 for internal server error
  }
};

const getProduct = async (req, res) => {

  const { paramID } = req.params;

  try {
    const product = await Product.findOne({ id: paramID }).select('id name amount price -_id');
    if (product) {
      return res.status(200).json(product); // Send the product as JSON response
    } else {
      return res.status(404).send('Product not found.'); // Send 404 if product not found
    }
  } catch (error) {
    console.error('Error occurred while fetching product:', error);
    return res.status(500).send('Error occurred while fetching product.'); // Send 500 for internal server error
  }
};

const purchase = async (req, res) => {

  const { paramID } = req.params;

  console.log("Handling purchase...");
  const userUUID = req.user

  // add credits to user
  const product = await Product.findOne({ id: paramID });
  const amount = product.amount;

  // get user using uuid
  const user = await User.findOne({ _id: req.user })
  
  // add credits to user model using mongodb
  user.credits += amount;
  await user.save();

  return res.json({ message: 'Purchase successful' })

  // Your purchase logic here
};

const createTestProducts = async (req, res) => {
  console.log('Creating test products...');

  // Delete all existing products
  await Product.deleteMany({})
  .then(() => {
    console.log('All products deleted successfully.');
  })
  .catch((error) => {
    console.error('Error deleting products:', error);
  });

  try {
    const count = await Product.countDocuments();

    if (count !== 0) {
      return res.status(200).send('Products already exist in the database.'); // Return 200 if products already exist
    }
  } catch (error) {
    console.error("Error occurred while checking products:", error);
    return res.status(500).send('Error occurred while checking products.');
  }

  const productsData = req.body;

  if (!Array.isArray(productsData) || productsData.length === 0) {
    console.log('Invalid products data format.');
    return res.status(400).send('Invalid products data format.');
  }

  try {
    // Save each product to the database
    const savedProducts = await Product.insertMany(productsData);
    console.log('Products added successfully:', savedProducts);
    res.status(200).send('Products added successfully');
  } catch (error) {
    console.error('Error occurred while adding products:', error);
    res.status(500).send('Error occurred while adding products');
  }
};

module.exports = { getProduct, purchase, createTestProducts, getProducts };
