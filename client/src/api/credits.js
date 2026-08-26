import { get, post } from './client.js'

export const listProducts = () => get('/api/products')

export const getProduct = (productId) => get(`/api/products/${productId}`)

/**
 * The demo checkout. Deliberately takes nothing but the package id — no card
 * details are collected, sent, or read.
 */
export const checkout = (productId) => post(`/api/credits/checkout/${productId}`)
