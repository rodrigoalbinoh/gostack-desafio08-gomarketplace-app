import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );
      if (loadedProducts) {
        setProducts(JSON.parse(loadedProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateAsyncStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateAsyncStorage();
  }, [products]);

  const addToCart = useCallback(
    async ({ id, title, image_url, price }) => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex < 0) {
        setProducts([
          ...products,
          {
            id,
            title,
            image_url,
            price,
            quantity: 1,
          },
        ]);
      } else {
        const newProducts = [...products];

        const { newQuantity } = products.reduce(
          (accumulator, product) => {
            if (product.id === id) {
              accumulator.newQuantity = product.quantity + 1;
            }
            return accumulator;
          },
          {
            newQuantity: Number(newProducts[productIndex]),
          },
        );

        newProducts[productIndex] = {
          id,
          title,
          image_url,
          price,
          quantity: newQuantity,
        };

        setProducts(newProducts);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const { title, image_url, price, quantity } = products[productIndex];

      const newProducts = [...products];

      const newQuantity = quantity + 1;

      newProducts[productIndex] = {
        id,
        title,
        image_url,
        price,
        quantity: newQuantity,
      };

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const { title, image_url, price, quantity } = products[productIndex];

      if (quantity === 1) {
        const productsFiltered = products.filter(product => product.id !== id);

        setProducts(productsFiltered);
      } else {
        const productsCopy = [...products];

        const newQuantity = quantity - 1;

        productsCopy[productIndex] = {
          id,
          title,
          image_url,
          price,
          quantity: newQuantity,
        };

        setProducts(productsCopy);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
