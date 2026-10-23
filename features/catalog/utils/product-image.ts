/**
 * Reglas de la imagen de producto que se sube con upload-image: las mismas
 * que valida la API (tipo y 5MB), compartidas por el formulario de producto
 * y el drawer de destacar.
 */
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PRODUCT_IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";

export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
