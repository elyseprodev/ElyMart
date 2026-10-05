"use client";

/* Product images may use user-entered hosts for seller listings in the browser preview. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { Heart, Plus, Star, Eye, Check } from "lucide-react";
import type { Product } from "@/lib/products";

type Props = {
  product: Product;
  wished: boolean;
  onWishlist: (product: Product) => void;
  onAdd: (product: Product) => void;
  onQuickView: (product: Product) => void;
};

export default function ProductCard({ product, wished, onWishlist, onAdd, onQuickView }: Props) {
  const [added, setAdded] = useState(false);
  const percentOff = product.compareAt
    ? Math.round((1 - product.price / product.compareAt) * 100)
    : null;
  const soldOut = product.stock <= 0;

  function addToCart() {
    if (soldOut) return;
    onAdd(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1100);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <button className="product-image-button" onClick={() => onQuickView(product)} aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </button>
        {product.label && (
          <span className={`product-label ${percentOff ? "product-label-sale" : ""}`}>
            {percentOff ? `${percentOff}% off` : product.label}
          </span>
        )}
        <button
          className={`wishlist-button ${wished ? "is-wished" : ""}`}
          onClick={() => onWishlist(product)}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wished}
        >
          <Heart size={17} fill={wished ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>
        <button className="quick-view-button" onClick={() => onQuickView(product)}>
          <Eye size={15} /> <span>Quick view</span>
        </button>
      </div>
      <div className="product-info">
        <div className="product-brand-line">
          <span>{product.brand}</span>
          {product.stock > 0 && product.stock <= 7 && <span className="stock-low">Only {product.stock} left</span>}
          {product.stock > 7 && <span className="stock-good"><Check size={11} /> In stock</span>}
          {soldOut && <span className="stock-out">Sold out</span>}
        </div>
        <button className="product-name" onClick={() => onQuickView(product)}>{product.name}</button>
        <div className="product-rating-row">
          {typeof product.rating === "number" ? (
            <>
              <Star size={13} fill="currentColor" strokeWidth={0} />
              <strong>{product.rating.toFixed(1)}</strong>
              <span>({product.reviewCount ?? 0})</span>
            </>
          ) : (
            <span className="product-category-caption">{product.category}</span>
          )}
        </div>
        <div className="product-buy-row">
          <div className="product-prices">
            <strong>{formatPrice(product.price)}</strong>
            {product.compareAt && <del>{formatPrice(product.compareAt)}</del>}
          </div>
          <button
            className={`add-product-button ${added ? "added" : ""}`}
            onClick={addToCart}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check size={17} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function formatPrice(value: number) {
  return `RWF ${new Intl.NumberFormat("en-RW").format(value)}`;
}
