const Product = require('../models/productModels');
const User = require('../models/userModel');

// Function to get a product by ID from the database
async function getProductById(productId) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', `${process.env.FRONTEND_URL}`)
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
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

async function seedDefaultProducts() {
  const defaults = [
    {
      id: "credits_100",
      name: "100 Credits",
      amount: 100,
      price: 50
    },
    {
      id: "credits_500",
      name: "500 Credits",
      amount: 500,
      price: 250
    },
    {
      id: "credits_1000",
      name: "1000 Credits",
      amount: 1000,
      price: 500
    }
  ];

  await Product.insertMany(defaults);
}

const getProducts = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', `${process.env.FRONTEND_URL}`)
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  console.log('Fetching products...')
  try {
    let products = await Product.find({}).select('id name description price -_id');

    // ✅ if empty, seed defaults then fetch again
    if (!products || products.length === 0) {
      console.log('No products found. Seeding default products...');
      await seedDefaultProducts();
      products = await Product.find({}).select('id name description price -_id');
    }

    console.log('Products:', products)

    return res.status(200).json(products); // Send the products as JSON response
  } catch (error) {
    console.error('Error occurred while fetching products:', error);
    return res.status(500).send('Error occurred while fetching products.'); // Send 500 for internal server error
  }
};

const getProduct = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', `${process.env.FRONTEND_URL}`)
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

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
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', `${process.env.FRONTEND_URL}`)
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  const { paramID } = req.params;

  console.log("Handling purchase...");

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

module.exports = { getProduct, purchase, getProducts };
