import type { CategoryInfo, Product } from '../types/index.ts';

export const INITIAL_CATEGORIES: CategoryInfo[] = [
  {
    id: 'pizzas-tradicionais',
    name: 'Pizzas Tradicionais',
    icon: '🍕',
    description: 'Sabores clássicos e irresistíveis por apenas R$ 33,99.',
  },
  {
    id: 'calzones',
    name: 'Calzones',
    icon: '🥟',
    description: 'Calzones artesanais recheados e dourados por apenas R$ 17,00.',
  },
  {
    id: 'bebidas',
    name: 'Bebidas & Refrigerantes',
    icon: '🥤',
    description: 'Guaraná, Pepsi, Coca-Cola e Latas geladíssimas.',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-mussarela',
    name: 'Pizza Mussarela',
    description: 'Molho artesanal especial, camada farta de mussarela derretida e orégano.',
    price: 33.99,
    category: 'pizzas-tradicionais',
    available: true,
  },
  {
    id: 'prod-mista',
    name: 'Pizza Mista',
    description: 'Presunto e mussarela selecionados com molho de tomate fresco e orégano.',
    price: 33.99,
    category: 'pizzas-tradicionais',
    available: true,
  },
  {
    id: 'calzone-mussarela',
    name: 'Calzone de Mussarela',
    description: 'Calzone crocante por fora e recheado com queijo mussarela derretido.',
    price: 17.0,
    category: 'calzones',
    available: true,
  },
  {
    id: 'calzone-mista',
    name: 'Calzone Misto',
    description: 'Recheado com presunto selecionado, queijo mussarela e orégano.',
    price: 17.0,
    category: 'calzones',
    available: true,
  },
  {
    id: 'prod-guarana-litro',
    name: 'Guaraná Antarctica 1L / 2L',
    description: 'Refrigerante Guaraná bem gelado para acompanhar seu pedido.',
    price: 9.0,
    category: 'bebidas',
    available: true,
  },
  {
    id: 'prod-pepsi-litro',
    name: 'Pepsi Cola 1L / 2L',
    description: 'Refrigerante Pepsi bem gelado.',
    price: 9.0,
    category: 'bebidas',
    available: true,
  },
];
