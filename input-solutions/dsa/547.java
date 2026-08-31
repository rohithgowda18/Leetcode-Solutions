class Solution {
    public int findCircleNum(int[][] isConnected) {
        
        int n= isConnected.length;
        boolean[] vis=new boolean[n];
        int ans=0;
        for(int i=0;i<n;i++){
            if(!vis[i]){
                dfs(isConnected,i,vis);
                ans++;
            }
        }

        return ans;
    }
    void dfs(int[][] isConnected,int i,boolean[] vis){
        vis[i]=true;
        for(int v=0;v<isConnected.length;v++){
            if(isConnected[i][v]==1 && !vis[v])dfs(isConnected,v,vis);
        }
    }
}
