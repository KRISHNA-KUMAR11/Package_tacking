

const Package_Tracking = async(req, res)=>{
    try{
    const { Package_Name,Send_Date,Deliver_From,Delivered_Location,Description,Package_weight_in_kgs,Price } = req.body;
        const newPackage = new Package({Package_Name,Send_Date,Deliver_From,Delivered_Location,Description,Package_weight_in_kgs,Price})
        await newPackage.save() 
        res.status(201).json(newPackage);
        } catch (err) {
        res.status(400).json({ error: err.message });
        }
}
module.exports = Package_Tracking;