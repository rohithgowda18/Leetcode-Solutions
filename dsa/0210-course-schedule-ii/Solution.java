class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
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
        List<Integer> topo=new ArrayList<>();

        Queue<Integer> q=new LinkedList<>();
        for(int i=0;i<numCourses;i++){
            if(indegree[i]==0)q.offer(i);
        }

        int cnt=0;
        while(!q.isEmpty()){
            int node=q.poll();
            cnt++;
            topo.add(node);
            for(int n:adj.get(node)){
                indegree[n]--;
                if(indegree[n]==0)q.offer(n);
            }
        }
        
        if (cnt != numCourses) {
            return new int[0];
        }
        int[] res=new int[topo.size()];

        for(int i=0;i<topo.size();i++){
            res[i]=topo.get(i);
        }

        
        return res;
    }
}