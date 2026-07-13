import { Injectable } from '@nestjs/common';
import { buildTrustGraphFromOrders } from '../../lib/trustGraph';
import { Order, Blacklist } from '@prisma/client';

@Injectable()
export class TrustGraphService {
  buildGraph(orders: Order[], blacklists: Blacklist[], focusPhone?: string) {
    return buildTrustGraphFromOrders(orders, blacklists, focusPhone);
  }
}
