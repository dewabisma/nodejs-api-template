import axios from 'axios';
import { Logger } from 'winston';
import { Service, Inject } from 'typedi';

@Service()
export default class InstagramService {
  constructor(
    @Inject('igAccessToken') private igAccessToken: string,
    @Inject('igBaseUrl') private igBaseUrl: string,
    @Inject('igGraphApiBaseUrl') private igGraphApiBaseUrl: string,
    @Inject('igUserId') private igUserId: string,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
  ) {}

  public async fetchUserFeed() {
    this.logger.info('Fetching user feed from Instagram graph API');
    const { data } = await axios.get<{ data: IG.UserMedia[] }>(
      `${this.igGraphApiBaseUrl}/v21.0/${this.igUserId}/media?fields=media_type,media_url,is_shared_to_feed,thumbnail_url,shortcode&access_token=${this.igAccessToken}`,
    );

    const filterFeedOnly = data.data.filter((media) => {
      const isFeed = media.is_shared_to_feed ?? true;

      return isFeed;
    });

    const userFeed = filterFeedOnly.map((media) => ({
      mediaUrl: media.thumbnail_url ?? media.media_url,
      postUrl: `${this.igBaseUrl}/p/${media.shortcode}`,
    }));

    return userFeed;
  }
}
