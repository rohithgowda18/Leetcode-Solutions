class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        int[] indegree=new int[numCourses];
        List<List<Integer>> adj = new ArrayList<>();

        for (int i = 0; i < numCourses; i++) {
            adj.add(new ArrayList<>());
        }

        for (int[] p : prerequisites) {
            int a = p[0];
            int b = p[1];

            adj.get(b).add(a);
            indegree[a]++;
        }

        Queue<Integer> q=new LinkedList<>();
        for(int i=0;i<numCourses;i++){
            if(indegree[i]==0)q.offer(i);
        }

        while(!q.isEmpty()){
            int node=q.poll();

            for(int n:adj.get(node)){
                indegree[n]--;
                if(indegree[n]==0)q.offer(n);
            }
        }

        for(int n:indegree){
            if(n!=0)return false;
        }

        return true;
    }
}
