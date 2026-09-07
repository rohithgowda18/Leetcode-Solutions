class Solution {
    class Edge {
        String node;
        double value;

        Edge(String node, double value) {
            this.node = node;
            this.value = value;
        }
    }
    public double[] calcEquation(List<List<String>> equations, double[] values, List<List<String>> queries) {
        Map<String, List<Edge>> adj = new HashMap<>();
        
        for(int i=0;i<equations.size();i++){
            String a = equations.get(i).get(0);
            String b = equations.get(i).get(1);
            double val=values[i];

            adj.putIfAbsent(a, new ArrayList<>());
            adj.putIfAbsent(b, new ArrayList<>());

            adj.get(a).add(new Edge(b, val));
            adj.get(b).add(new Edge(a, 1.0 / val));
        }
        
        double[] result = new double[queries.size()];
        for(int i=0;i<queries.size();i++){
            String a=queries.get(i).get(0);
            String b=queries.get(i).get(1);

            if(!adj.containsKey(a) || !adj.containsKey(b)){
                result[i]= -1.0;
            }else{
                Set<String> set=new HashSet<>();

                result[i] = dfs(a,b,1.0,adj,set);
            }
        }

        return result;
    }

    double dfs(String a,String b,double ans,Map<String,List<Edge>> adj,Set<String> set){
        if(a.equals(b))return ans;

        set.add(a);
        for(Edge nei:adj.get(a)){
            String v=nei.node;
            double val=nei.value;
            if(set.contains(v))continue;

            double result = dfs(v,b,ans*val,adj,set);
            
            if (result != -1.0) {
                return result;
            }
        }

        return -1.0;
    }
}
