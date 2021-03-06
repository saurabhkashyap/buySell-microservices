import { Listener, OrderCancelledEvent, Subject } from "@bechna-khareedna/common";
import { Message } from "node-nats-streaming";
import { Constants } from "../../constants";
import { SellItem } from "../../models/sell-item";
import { SellItemUpdatedPublisher } from "../publishers/sellItem-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent>{
    readonly subject = Subject.OrderCancelled;
    readonly queueGroupName = Constants.QueueGroupName;
    
    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        //find the sell item the order is reserving
        const sellItem = await SellItem.findById(data.sellItem.id);

        //if no sell item, throw error
        if(!sellItem){
            throw new Error('sell item not found');
        }

        //mark the sell item as reserved by setting its orderId property
        sellItem.set({orderId: null});

        //save the sell item
        await sellItem.save();

        await new SellItemUpdatedPublisher(this.client).publish({
            id: sellItem.id,
            price: sellItem.price,
            title: sellItem.title,
            userId: sellItem.userId,
            version: sellItem.version,
            orderId: sellItem.orderId
        });
        
        //ack the message
        msg.ack();
    }
}