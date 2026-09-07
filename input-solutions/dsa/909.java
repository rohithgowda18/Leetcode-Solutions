class Solution {
    public int snakesAndLadders(int[][] board) {
        int n=board.length;

        int[] cells = new int[n*n+1];
        int index=1;
        int nrow=0;
        for(int row=n-1;row>=0;row--){
            if(nrow%2==0){
                for (int col = 0; col < n; col++) cells[index++] = board[row][col];
            } else {
                for (int col = n - 1; col >= 0; col--) cells[index++] = board[row][col];
            }
            nrow++;
        }
        boolean[] vis=new boolean[n*n+1];
        Queue<int[]> q=new LinkedList<>();
        q.offer(new int[]{1,0});
        vis[1]=true;
        
        while(!q.isEmpty()){
            int[] node=q.poll();
            int sq=node[0];
            int rolls=node[1];

            if(sq==n*n)return rolls;
            for(int i=1;i<=6 && sq+i<=n*n;i++){
                int next=sq+i;

                if(cells[next]!=-1)next=cells[next];

                if(!vis[next]){
                    vis[next]=true;
                    q.offer(new int[]{next,rolls+1});
                }
            }
        }
        return -1;
    }
    
}
