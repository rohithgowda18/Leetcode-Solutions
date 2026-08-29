class Solution {
    public int orangesRotting(int[][] grid) {
        Queue<int[]> q=new LinkedList<>();
        int m=grid.length;
        int n=grid[0].length;

        int fresh=0;
        for(int i=0;i<m;i++){
            for(int j=0;j<n;j++){
                if(grid[i][j]==2)q.add(new int[]{i,j});
                else if(grid[i][j]==1)fresh++;
            }
        }
        int sec=0;
        int[][] dir={
            {-1,0},{1,0},{0,-1},{0,1}
        };

        while(!q.isEmpty() && fresh>0){
            int size=q.size();

            for(int i=0;i<size;i++){
                int[] cur=q.poll();
                int r=cur[0],c=cur[1];

                for(int[] d:dir){
                    int nr=r+d[0];
                    int nc=c+d[1];

                     if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc]==1) {
                        grid[nr][nc] = 2;
                        fresh--;

                        q.offer(new int[]{nr, nc});
                    }
                }
            }
            sec++;
        }

        return fresh==0? sec:-1;
    }
}
