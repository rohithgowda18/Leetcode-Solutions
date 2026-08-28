class Solution {
    public boolean isBipartite(int[][] graph) {
        
        int[] color=new int[graph.length];
        Arrays.fill(color,-1);

        for(int i=0;i<graph.length;i++){
            if(color[i]==-1){
                if(!bfs(graph,i,color))return false;
            }
        }

        return true;
    }
    boolean bfs(int[][] graph,int st,int[] color){
        Queue<Integer> q=new LinkedList<>();
        q.offer(st);
        color[st]=0;

        while(!q.isEmpty()){
            int node=q.poll();

            for(Integer i:graph[node]){
                if(color[i]==-1){
                    color[i] = (color[node]==0)? 1:0;
                    q.offer(i);
                }else if(color[node]==color[i]) return false;
            } 
        }

        return true;
    }
}
