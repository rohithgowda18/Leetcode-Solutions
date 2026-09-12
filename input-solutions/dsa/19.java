class Solution {
    public ListNode removeNthFromEnd(ListNode head, int n) {
        ListNode node=head;
        int size=0;
        while(node!=null){
            size++;
            node=node.next;
        }
        if(n==size)return head.next;

        n=size-n-1;
        node=head;
        
        while(n-->0){
            node=node.next;
        }
        node.next=node.next.next;

        return head;
    }
}
