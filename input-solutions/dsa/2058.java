class Solution {
    public int[] nodesBetweenCriticalPoints(ListNode head) {
        if(head==null || head.next==null || head.next.next==null)return new int[]{-1,-1};

        ListNode prev=head;
        ListNode cur=head.next;
        ListNode next=head.next.next;
        
        int idx=1;
        int first=-1;
        int last=-1;
        int min=Integer.MAX_VALUE;

        while(next!=null){
            if(cur.val>prev.val && cur.val>next.val || cur.val<prev.val && cur.val<next.val){
                if(first==-1)first=idx;
                else min=Math.min(min,idx-last);

                last=idx;
            }
            prev=cur;
            cur=next;
            next=next.next;
            idx++;
        }

        if(first==last)return new int[]{-1,-1};

        return new int[]{min,last-first};
    }
}
