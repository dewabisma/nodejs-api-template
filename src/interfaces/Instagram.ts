export interface InstagramMedia {
  media_type: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  media_url: string;
  is_shared_to_feed?: boolean;
  /** @dev this thumbnail only exist for video */
  thumbnail_url?: string;
  /** @dev this shortcode is used to map the post of the instagram */
  shortcode: string;
  id: string;
}
