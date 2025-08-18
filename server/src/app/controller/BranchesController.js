const Branch = require('../models/branch');

exports.getAllBranches = async (req, res) => {
    try {
        const branches = await Branch.findAll();
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBranch = async (req, res) => {
    try {
        const { BranchName } = req.body;
        const newBranch = await Branch.create({ BranchName });
        res.json(newBranch);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params; 
        const branch = await Branch.findByPk(id); 

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        await branch.destroy(); 
        res.json({ message: 'Branch deleted successfully' }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.editBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { BranchName } = req.body;

        const branch = await Branch.findByPk(id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found.' });
        }
        branch.BranchName = BranchName;
        await branch.save();
        res.json({ message: 'Cập nhật thành công.', branch });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};